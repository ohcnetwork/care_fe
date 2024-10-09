/* eslint-disable i18next/no-literal-string */
import React, { useEffect, Suspense } from "react";
import { PluginConfigType } from "./Common/hooks/useConfig";
import { CareAppsContext, useCareApps } from "./Common/hooks/useCareApps";
import {
  careApps,
  EnabledPluginConfig,
  PluginManifest,
  pluginMap,
} from "./pluginMap";
import { UserAssignedModel } from "./Components/Users/models";
import ErrorBoundary from "./Components/Common/ErrorBoundary";

export default function PluginEngine({
  plugins,
  setPlugins,
  children,
}: {
  plugins: PluginConfigType[];
  setPlugins: React.Dispatch<React.SetStateAction<PluginConfigType[]>>;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const loadedPlugins = await Promise.all(
          careApps.map(async (appManifest, _index) => {
            const plugin = await appManifest;
            if (!plugin) {
              throw new Error(`Unable to Load Plugin not found`);
            }
            console.log("Plugin", plugin.plugin, Promise.resolve(plugin));
            return {
              ...plugin,
            }; // Cast to PluginConfigType
          }),
        );

        setPlugins(loadedPlugins as unknown as PluginConfigType[]);
        console.log("Loaded plugins", loadedPlugins);
      } catch (error) {
        console.error("Error loading plugins", error);
      }
    };

    loadPlugins();
  }, [setPlugins]);

  return (
    <Suspense fallback={<div>Loading plugins...</div>}>
      <ErrorBoundary
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            Error loading plugins
          </div>
        }
      >
        <CareAppsContext.Provider value={plugins}>
          {children}
          {plugins.length > 0 && (
            <span className="absolute left-0 top-0 z-50 w-screen bg-green-800 text-center text-sm text-white">
              CareApps Enabled
            </span>
          )}
        </CareAppsContext.Provider>
      </ErrorBoundary>
    </Suspense>
  );
}

export function PLUGIN_DoctorConnectButtons({
  user,
}: {
  user: UserAssignedModel;
}) {
  const plugins = useCareApps();
  const loadedPlugins: PluginManifest[] = plugins.filter(
    (plugin): plugin is PluginManifest => typeof plugin === "object",
  );
  const loadedPluginNames = loadedPlugins.map((plugin) => plugin.plugin);
  console.log("Loaded plugins", loadedPluginNames);
  const loadedPluginMaps = pluginMap.filter((plugin) =>
    loadedPluginNames.includes(plugin.plugin),
  );
  console.log(
    "Scanning through ",
    loadedPluginMaps.map((plugin) => Object.keys(plugin.components)),
    " plugins",
  );
  const activePlugins = loadedPluginMaps
    .filter((plugin): plugin is EnabledPluginConfig =>
      Object.keys(plugin.components).includes("DoctorConnectButtons"),
    )
    .map((plugin) => plugin.plugin);
  const activePluginMaps = pluginMap.filter((plugin) =>
    activePlugins.includes(plugin.plugin),
  );
  return (
    <div>
      {activePluginMaps.map((plugin, index) => {
        const DoctorConnectButtons = plugin.components.DoctorConnectButtons;
        if (!DoctorConnectButtons) {
          return null;
        }
        return (
          <div key={index}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <DoctorConnectButtons user={user} />
          </div>
        );
      })}
    </div>
  );
}
