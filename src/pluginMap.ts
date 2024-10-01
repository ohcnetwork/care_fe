import { LazyExoticComponent } from "react";
import { PluginManifest } from "./PluginEngine";
import { UserAssignedModel } from "./Components/Users/models";

// Define the available plugins
export type AvailablePlugin =
  | "@apps/care-livekit"
  | "@apps/care-ohif"
  | "@apps/care-scribe";

export type AvailablePluginManifest =
  | "@app-manifest/care-livekit"
  | "@app-manifest/care-ohif"
  | "@app-manifest/care-scribe";

export type DoctorConnectButtonComponentType = React.FC<{
  user: UserAssignedModel;
}>;

// Define supported plugin components
export type SupportedPluginComponents = {
  DoctorConnectButtons: DoctorConnectButtonComponentType;
};

// Create a type for lazy-loaded components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent<T extends React.FC<any>> = LazyExoticComponent<T>;

// Define PluginComponentMap with lazy-loaded components
export type PluginComponentMap = {
  [K in keyof SupportedPluginComponents]?: LazyComponent<
    SupportedPluginComponents[K]
  >;
};

// Create a type that ensures only available plugins can be used
export type EnabledPluginConfig = {
  plugin: string;
  manifestPath: AvailablePluginManifest;
  path: AvailablePlugin;
  manifest: Promise<PluginManifest>;
  // Components are a dictionary, with the key being the component name, and the value being the component type
  components: PluginComponentMap;
};

// Export a type for the fully loaded plugin
export type LoadedPlugin = PluginManifest;

// Export a function to get only the enabled plugins
export function getEnabledPlugins(): EnabledPluginConfig[] {
  return pluginMap;
}

// const careLivekitM = import("@app-manifest/care-livekit").then(
//   (module) => module.default,
// ) as Promise<PluginManifest>;
// const LiveKitDoctorConnectButtons = lazy(() =>
//   import("@apps/care-livekit").then((module) => ({
//     default: module.DoctorConnectButtons,
//   })),
// );

// const careOhifM = import("@app-manifest/care-ohif").then(
//   (module) => module.default,
// ) as Promise<PluginManifest>;

// const careScribeM = import("@app-manifest/care-scribe").then(
//   (module) => module.default,
// ) as Promise<PluginManifest>;

const pluginMap: EnabledPluginConfig[] = [];

// careLivekitM, careOhifM, careScribeM
// const pluginMap: EnabledPluginConfig[] = [
//   {
//     plugin: "care-livekit",
//     path: "@apps/care-livekit",
//     manifestPath: "@app-manifest/care-livekit",
//     manifest: careLivekitM,
//     components: {
//       DoctorConnectButtons: LiveKitDoctorConnectButtons,
//     },
//   },
//   {
//     plugin: "care-ohif",
//     path: "@apps/care-ohif",
//     manifestPath: "@app-manifest/care-ohif",
//     manifest: careOhifM,
//     components: {},
//   },
//   {
//     plugin: "care-scribe",
//     path: "@apps/care-scribe",
//     manifestPath: "@app-manifest/care-scribe",
//     manifest: careScribeM,
//     components: {},
//   },
// ];

export { pluginMap };
