import { useQuery } from "@tanstack/react-query";
import {
  __federation_method_getRemote as getFederationRemote,
  __federation_method_setRemote as setFederationRemote,
  __federation_method_unwrapDefault as unwrapModule,
} from "__federation__";
import React, { Suspense, useEffect, useState } from "react";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";

import { CareAppsContext, useCareApps } from "@/hooks/useCareApps";
import query from "@/Utils/request/query";

import { PluginManifest, SupportedPluginComponents } from "@/pluginTypes";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";

// Import the remote component synchronously
export default function PluginEngine({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pluginManifests, setPluginManifests] = useState<PluginManifest[]>([]);

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
          if (!plugin.meta.url) {
            console.error(`Plugin ${plugin.slug} is missing a URL in meta`);
            return undefined;
          }
          setFederationRemote(plugin.slug, {
            url: () => Promise.resolve(plugin.meta.url),
            format: "esm",
            from: "vite",
            externalType: "promise",
          });

          return await getFederationRemote(plugin.slug, "./manifest")
            .then((manifest) => {
              return manifest;
            })
            .catch(() =>
              console.error(
                `There was an error enabling the app ${plugin.slug}`,
              ),
            );
        }),
      );
      const filteredManifests = manifests.filter(
        (m): m is PluginManifest => m !== undefined,
      );
      const availablePlugins = filteredManifests.map((manifest) =>
        unwrapModule(manifest),
      );
      console.log(
        `Loading ${filteredManifests.length} plugins; available plugins`,
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
  React.ComponentProps<SupportedPluginComponents[K]>;

export function PLUGIN_Component<K extends keyof SupportedPluginComponents>({
  __name,
  ...props
}: { __name: K } & PluginProps<K>) {
  const plugins = useCareApps();

  return (
    <>
      {plugins.map((plugin) => {
        const Component = plugin.components?.[
          __name
        ] as React.ComponentType<unknown>;

        if (!Component) {
          return null;
        }

        return (
          <React.Suspense key={plugin.plugin} fallback={<div>Loading...</div>}>
            <Component {...props} />
          </React.Suspense>
        );
      })}
    </>
  );
}
