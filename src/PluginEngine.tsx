import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { useQuery } from "@tanstack/react-query";
import {
  __federation_method_getRemote as getFederationRemote,
  __federation_method_setRemote as setFederationRemote,
  __federation_method_unwrapDefault as unwrapModule,
} from "__federation__";
import { Loader2Icon } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";

import { CareAppsContext, useCareApps } from "@/hooks/useCareApps";
import query from "@/Utils/request/query";

import { PluginManifest, SupportedPluginComponents } from "@/pluginTypes";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import { t } from "i18next";
import { z } from "zod";

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
            url: () => Promise.resolve(plugin.meta.url),
            format: "esm",
            from: "vite",
            externalType: "promise",
          });

          return await getFederationRemote(plugin.slug, "./manifest")
            .then((manifest) => {
              return manifest;
            })
            .catch((e) =>
              console.error(
                `There was an error enabling the app ${plugin.slug}`,
                e,
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

      if (availablePlugins.length === 0) {
        return;
      }

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
