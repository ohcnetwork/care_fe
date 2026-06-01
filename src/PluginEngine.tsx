import { CareAppsContext, useCareApps } from "@/hooks/useCareApps";
import {
  PluginManifest,
  PluginManifestWithMeta,
  SupportedPluginComponents,
} from "@/pluginTypes";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  __federation_method_getRemote as getFederationRemote,
  __federation_method_setRemote as setFederationRemote,
  __federation_method_unwrapDefault as unwrapModule,
} from "__federation__";
import React, { Suspense, useEffect, useMemo, useRef } from "react";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { addOverride } from "@/lib/override";
import { PlugConfig, PlugConfigMeta } from "@/types/plugConfig";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import { mergePlugConfigs } from "@/Utils/plugConfig";
import query from "@/Utils/request/query";
import { deepFreeze } from "@/Utils/utils";
import { t } from "i18next";
import { Loader2Icon } from "lucide-react";
import { localDevPluginManifests } from "virtual:care-local-plugins";
import { z } from "zod";

const getPluginManifest = async (config: PlugConfig) => {
  const localManifest = localDevPluginManifests[config.slug];

  if (localManifest) {
    return {
      ...localManifest,
      meta: config.meta,
    } as PluginManifestWithMeta;
  }

  if (
    !config.meta.url ||
    !z.string().url().safeParse(config.meta.url).success
  ) {
    console.error(
      `Plugin ${config.slug} has an invalid URL (${config.meta.url}) in meta`,
    );
    return null;
  }

  setFederationRemote(config.slug, {
    url: () => Promise.resolve(config.meta.url as string),
    format: "esm",
    from: "vite",
    externalType: "promise",
  });

  try {
    const module = await getFederationRemote(config.slug, "./manifest");
    const manifest = unwrapModule(module) as PluginManifest;
    return {
      ...manifest,
      meta: config.meta,
    } as PluginManifestWithMeta;
  } catch (e) {
    console.error(`There was an error enabling the app ${config.slug}`, e);
    return null;
  }
};

// Import the remote component synchronously
export default function PluginEngine({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch enabled plugins from the backend API
  const { data: enabledPlugins } = useQuery({
    queryKey: ["enabled-plugins"],
    queryFn: query(plugConfigApi.list, {
      silent: (response) => response.status === 401 || response.status === 403,
    }),
    retry: false,
  });

  const resolvedPlugins = useMemo(
    () => mergePlugConfigs(enabledPlugins?.configs ?? []),
    [enabledPlugins?.configs],
  );

  const pluginsQuery = useQueries({
    queries: resolvedPlugins.map((config) => ({
      queryKey: ["plugin-manifest", config.slug],
      queryFn: () => getPluginManifest(config),
    })),
    combine: (queries) =>
      queries.map(({ data, isLoading }, i) => {
        const config = resolvedPlugins[i];

        if (isLoading) {
          return { ...config, isLoading: true as const };
        }

        return { ...config, isLoading: false as const, ...data! };
      }),
  });

  const pluginMeta = useMemo(() => {
    return pluginsQuery.reduce(
      (acc, plugin) => {
        if (!plugin.isLoading && plugin.meta) {
          acc[plugin.slug] = deepFreeze({ ...plugin.meta });
        }
        return acc;
      },
      {} as Record<string, PlugConfigMeta>,
    );
  }, [pluginsQuery]);

  useEffect(() => {
    window.__CARE_PLUGIN_RUNTIME__ = deepFreeze({ meta: pluginMeta });
  }, [pluginMeta]);

  // Register plugin overrides
  const overrideCleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Clean up previous overrides
    overrideCleanupRef.current.forEach((cleanup) => cleanup());
    overrideCleanupRef.current = [];

    // Register new overrides from all loaded plugins
    for (const plugin of pluginsQuery) {
      if (plugin.isLoading || !plugin.overrides) continue;

      for (const override of plugin.overrides) {
        const cleanup = addOverride(override.component, {
          component: override.replacement,
          condition: override.condition,
          priority: override.priority,
          description:
            override.description ?? `Override from plugin: ${plugin.plugin}`,
        });
        overrideCleanupRef.current.push(cleanup);
      }
    }

    // Cleanup on unmount
    return () => {
      overrideCleanupRef.current.forEach((cleanup) => cleanup());
      overrideCleanupRef.current = [];
    };
  }, [pluginsQuery]);

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            Care has encountered an unexpected error.
          </div>
        }
      >
        <CareAppsContext.Provider value={pluginsQuery}>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </CareAppsContext.Provider>
      </ErrorBoundary>
    </Suspense>
  );
}

type PluginProps<K extends keyof SupportedPluginComponents> =
  React.ComponentProps<SupportedPluginComponents[K]> & {
    __meta?: PluginManifestWithMeta["meta"];
  };

type PluginComponentProps = {
  [K in keyof SupportedPluginComponents]: { __name: K } & PluginProps<K>;
}[keyof SupportedPluginComponents];

export function PLUGIN_Component(props: PluginComponentProps) {
  const { __name, ...restProps } = props;
  const careApps = useCareApps();

  return (
    <>
      {careApps.map((plugin) => {
        if (plugin.isLoading) {
          return null;
        }

        const Component = plugin.components?.[__name] as React.ComponentType<
          PluginProps<typeof __name>
        >;
        if (!Component) {
          return null;
        }

        const propsWithMeta = {
          ...restProps,
          __meta: plugin.meta,
        } as PluginProps<typeof __name>;

        return (
          <PluginErrorBoundary key={plugin.plugin} pluginName={plugin.plugin}>
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center gap-2">
                  <Loader2Icon
                    role="status"
                    aria-label="Loading"
                    className="size-4 animate-spin"
                  />
                  <p className="text-sm text-gray-600">{t("loading")}</p>
                </div>
              }
            >
              <Component {...propsWithMeta} />
            </React.Suspense>
          </PluginErrorBoundary>
        );
      })}
    </>
  );
}
