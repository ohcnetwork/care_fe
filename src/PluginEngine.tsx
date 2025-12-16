import { CareAppsContext, useCareApps } from "@/hooks/useCareApps";
import {
  PluginManifest,
  PluginManifestWithMeta,
  SupportedPluginComponents,
} from "@/pluginTypes";
import {
  __federation_method_getRemote as getFederationRemote,
  __federation_method_setRemote as setFederationRemote,
  __federation_method_unwrapDefault as unwrapModule,
} from "__federation__";
import React, { Suspense, useEffect, useState } from "react";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Loader2Icon } from "lucide-react";
import { z } from "zod";
import { PlugConfigMeta } from "./types/plugConfig";

// Import the remote component synchronously
export default function PluginEngine({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pluginManifests, setPluginManifests] = useState<
    PluginManifestWithMeta[]
  >([]);

  // Fetch enabled plugins from the backend API
  const { data: enabledPlugins } = useQuery({
    queryKey: ["enabled-plugins"],
    queryFn: query(plugConfigApi.list),
  });

  useEffect(() => {
    const fetchPluginManifests = async () => {
      if (!enabledPlugins) return;

      const manifests = await Promise.all(
        enabledPlugins.configs.map(async (plugin) => {
          if (
            !plugin.meta.url ||
            !z.string().url().safeParse(plugin.meta.url).success
          ) {
            console.error(
              `Plugin ${plugin.slug} has an invalid URL (${plugin.meta.url}) in meta`,
            );
            return undefined;
          }

          setFederationRemote(plugin.slug, {
            url: () => Promise.resolve(plugin.meta.url as string),
            format: "esm",
            from: "vite",
            externalType: "promise",
          });

          return await getFederationRemote(plugin.slug, "./manifest")
            .then((module) => {
              const manifest = unwrapModule<PluginManifest>(module);
              return {
                ...manifest,
                meta: plugin.meta,
              } as PluginManifestWithMeta;
            })
            .catch((e) =>
              console.error(
                `There was an error enabling the app ${plugin.slug}`,
                e,
              ),
            );
        }),
      );
      const availablePlugins = manifests.filter(
        (m): m is PluginManifestWithMeta => m !== undefined,
      );

      if (availablePlugins.length === 0) {
        console.log("No plugins found");
        return;
      }

      console.log(
        `Loading ${availablePlugins.length} plugins; available plugins`,
        availablePlugins,
      );
      setPluginManifests(availablePlugins);
    };

    fetchPluginManifests();
  }, [enabledPlugins]);

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            Care has encountered an unexpected error.
          </div>
        }
      >
        <CareAppsContext.Provider value={pluginManifests}>
          <Suspense fallback={<Loading />}></Suspense>
          {children}
        </CareAppsContext.Provider>
      </ErrorBoundary>
    </Suspense>
  );
}

type PluginProps<K extends keyof SupportedPluginComponents> =
  SupportedPluginComponents[K] extends React.FC<infer P> ? P : never;

export function PLUGIN_Component<K extends keyof SupportedPluginComponents>({
  __name,
  ...props
}: { __name: K } & PluginProps<K>) {
  const plugins = useCareApps();

  return (
    <>
      {plugins.map((plugin) => {
        const Component = plugin.components?.[__name] as React.ComponentType<
          PluginProps<K> & { __meta: PlugConfigMeta }
        >;
        const propsWithMeta = {
          ...props,
          __meta: plugin.meta,
        } as PluginProps<K> & { __meta: PlugConfigMeta };

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
              <Component {...propsWithMeta} />
            </React.Suspense>
          </PluginErrorBoundary>
        );
      })}
    </>
  );
}
