import {
  __federation_method_getRemote,
  __federation_method_setRemote, // @ts-expect-error __federation__ is not typed
} from "__federation__";
import React, { Suspense, useEffect, useState } from "react";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";

import { CareAppsContext, useCareApps } from "@/hooks/useCareApps";

import { PluginManifest, SupportedPluginComponents } from "@/pluginTypes";

async function enabledPlugins() {
  // this would be a call to the care backend
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    {
      name: "care_doctor_connect_fe",
      url: "http://localhost:6173/assets/remoteEntry.js",
    },
  ];
}

// Import the remote component synchronously
export default function PluginEngine({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pluginManifests, setPluginManifests] = useState<PluginManifest[]>([]);

  useEffect(() => {
    const fetchEnabledPlugins = async () => {
      const plugins = await enabledPlugins();

      const manifests = await Promise.all(
        plugins.map(async (plugin) => {
          __federation_method_setRemote(plugin.name, {
            url: () => Promise.resolve(plugin.url),
            format: "esm",
            from: "vite",
            externalType: "promise",
          });

          return await __federation_method_getRemote(plugin.name, "./manifest");
        }),
      );

      setPluginManifests(manifests);
    };

    fetchEnabledPlugins();
  }, []);

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
