import { PluginConfig } from "./Common/hooks/useConfig";
import { PluginManifest } from "./PluginEngine";

// Define the available plugins
export type AvailablePlugin =
  | "@apps/care-livekit"
  | "@apps/care-ohif"
  | "@apps/care-scribe";

export type AvailablePluginManifest =
  | "@app-manifest/care-livekit"
  | "@app-manifest/care-ohif"
  | "@app-manifest/care-scribe";

// Create a type that ensures only available plugins can be used
export type EnabledPluginConfig = {
  plugin: string;
  manifestPath: AvailablePluginManifest;
  path: AvailablePlugin;
  manifest: Promise<PluginManifest>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: Promise<any>;
};

// Export a type for the fully loaded plugin
export type LoadedPlugin = PluginConfig;

// Export a function to get only the enabled plugins
export function getEnabledPlugins(): EnabledPluginConfig[] {
  return pluginMap;
}

// const careLivekitM = import("@app-manifest/care-livekit").then(
//   (module) => module.default,
// ) as Promise<PluginManifest>;
// const careLivekitComponents = import("@apps/care-livekit");

// const careOhifM = import("@app-manifest/care-ohif").then(
//   (module) => module.default,
// ) as Promise<PluginManifest>;
// const careOhifComponents = import("@apps/care-ohif");

// const careScribeM = import("@app-manifest/care-scribe").then(
//   (module) => module.default,
// ) as Promise<PluginManifest>;
// const careScribeComponents = import("@apps/care-scribe");

// careLivekitM, careOhifM, careScribeM
const pluginManifests: EnabledPluginConfig[] = [];

// {
//   plugin: "care-livekit",
//   path: "@apps/care-livekit",
//   manifestPath: "@app-manifest/care-livekit",
//   manifest: careLivekitM,
//   components: careLivekitComponents,
// },
// {
//   plugin: "care-ohif",
//   path: "@apps/care-ohif",
//   manifestPath: "@app-manifest/care-ohif",
//   manifest: careOhifM,
//   components: careOhifComponents,
// },
// {
//   plugin: "care-scribe",
//   path: "@apps/care-scribe",
//   manifestPath: "@app-manifest/care-scribe",
//   manifest: careScribeM,
//   components: careScribeComponents,
// },

// Define the enabled plugins
export const pluginMap: EnabledPluginConfig[] = [];

export { pluginManifests };
