import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  __federation_method_getRemote as getFederationRemote,
  __federation_method_setRemote as setFederationRemote,
  __federation_method_unwrapDefault as unwrapModule,
} from "__federation__";
import { Loader2Icon } from "lucide-react";
import React, { Suspense } from "react";

import { CareAppsContext, useCareApps } from "@/hooks/useCareApps";
import query from "@/Utils/request/query";

import { PluginManifest, SupportedPluginComponents } from "@/pluginTypes";
import { PlugConfig } from "@/types/plugConfig";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import { t } from "i18next";
import { z } from "zod";

const getPluginManifest = async (config: PlugConfig) => {
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
    url: () => Promise.resolve(config.meta.url),
    format: "esm",
    from: "vite",
    externalType: "promise",
  });

  try {
    const manifest = await getFederationRemote(config.slug, "./manifest");
    return unwrapModule(manifest) as PluginManifest;
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
    queryFn: query(plugConfigApi.list),
  });

  const pluginsQuery = useQueries({
    queries: (enabledPlugins?.configs ?? []).map((config) => ({
      queryKey: ["plugin-manifest", config.slug],
      queryFn: () => getPluginManifest(config),
    })),
    combine: (queries) =>
      queries.map(({ data, isLoading }, i) => {
        const config = (enabledPlugins?.configs ?? [])[i];

        if (isLoading) {
          return { ...config, isLoading: true as const };
        }

        return { ...config, isLoading: false as const, ...data! };
      }),
  });

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
          <Suspense fallback={<Loading />}></Suspense>
          {children}
        </CareAppsContext.Provider>
      </ErrorBoundary>
    </Suspense>
  );
}

type PluginProps<K extends keyof SupportedPluginComponents> =
  React.ComponentProps<SupportedPluginComponents[K]>;

export function PLUGIN_Component<K extends keyof SupportedPluginComponents>({
  __name,
  ...props
}: { __name: K } & PluginProps<K>) {
  const careApps = useCareApps();

  return (
    <>
      {careApps.map((plugin) => {
        if (plugin.isLoading) {
          return null;
        }

        const Component = plugin.components?.[
          __name
        ] as React.ComponentType<unknown>;

        if (!Component) {
          return null;
        }

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
              <Component {...props} />
            </React.Suspense>
          </PluginErrorBoundary>
        );
      })}
    </>
  );
}
