/* eslint-disable i18next/no-literal-string */
import React, { useEffect, useState } from "react";
import { PluginConfigType } from "./Common/hooks/useConfig";

type PluginComponentType = React.ComponentType<any>;

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
  const [pluginComponents, setPluginComponents] = useState<
    PluginComponentType[]
  >([]);

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const module = await import("@apps/care-scribe-alpha-plug");
        setPluginComponents([module.Scribe]);
        setPlugins((plugins) => [
          ...plugins,
          { plugin: "care-scribe-alpha-plug", routes: module.routes },
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
      <>Dynamic Plugins here:</>
      {pluginComponents.map((PluginComponent, index) => (
        <PluginComponent key={index} />
      ))}
      {children}
    </>
  );
}
