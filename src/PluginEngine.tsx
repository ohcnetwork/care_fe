/* eslint-disable i18next/no-literal-string */
import React, { useEffect, lazy, Suspense } from "react";
import { PluginConfigType } from "./Common/hooks/useConfig";
import { CareAppsContext, useCareApps } from "./Common/hooks/useCareApps";
import { AppRoutes } from "./Routers/AppRouter";
import { INavItem } from "./Components/Common/Sidebar/Sidebar";
import { pluginManifests } from "./pluginMap";
import { UserAssignedModel } from "./Components/Users/models";
import ErrorBoundary from "./Components/Common/ErrorBoundary";

type SupportedPluginExtensions =
  | "DoctorConnectButtons"
  | "PatientContactButtons";

export type PluginManifest = {
  routes: AppRoutes;
  extends: SupportedPluginExtensions[];
  navItems: INavItem[];
  components?: {
    [K in SupportedPluginExtensions]?: () => Promise<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: React.ComponentType<any>;
    }>;
  };
};

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
          pluginManifests.map(async (pluginManifest, index) => {
            const manifest = await pluginManifest;
            if (!manifest) {
              throw new Error(`Unable to Load Plugin not found`);
            }
            return {
              ...manifest,
              plugin: `plugin-${index}`,
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

const CareLivekitDoctorConnectButtons = lazy(() =>
  import("@apps/care-livekit").then((module) => ({
    default: module.DoctorConnectButtons,
  })),
);

export function PLUGIN_DoctorConnectButtons({
  user,
}: {
  user: UserAssignedModel;
}) {
  const plugins = useCareApps();
  const activePlugins = plugins.filter(
    (plugin): plugin is PluginManifest & { plugin: string } =>
      typeof plugin === "object" &&
      "extends" in plugin &&
      plugin.extends.includes("DoctorConnectButtons"),
  );

  return (
    <div>
      {" "}
      <div className="sr-only">{activePlugins.length} plugins</div>
      {activePlugins.map((plugin, index) => {
        return <CareLivekitDoctorConnectButtons user={user} key={index} />;
      })}
    </div>
  );
}
