/* eslint-disable i18next/no-literal-string */
import React, { useEffect } from "react";
import { PluginConfigType } from "./Common/hooks/useConfig";
import { CareAppsContext } from "./Common/hooks/useCareApps";

// type PluginComponentType = React.ComponentType<any>;

export default function PluginEngine({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  plugins,
  setPlugins,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}: {
  plugins: PluginConfigType[];
  setPlugins: React.Dispatch<React.SetStateAction<PluginConfigType[]>>;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const module = await import("@apps/care-livekit");
        setPlugins((prevPlugins) => [
          ...prevPlugins,
          {
            plugin: "care-livekit",
            routes: module.routes,
            navItems: module.manifest.navItems,
          },
        ]);

        console.log("Loaded plugins", module);
      } catch (error) {
        console.error("Error loading plugins", error);
      }
    };

    setTimeout(loadPlugins, 1000);
  }, []);

  return (
    <>
      <CareAppsContext.Provider value={plugins}>
        {children}
        <span className="absolute left-0 top-0 z-50 w-screen bg-green-800 text-center text-sm text-white">
          CareApps Enabled
        </span>
      </CareAppsContext.Provider>
    </>
  );
}
