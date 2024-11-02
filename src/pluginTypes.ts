import { LazyExoticComponent } from "react";
import { UserAssignedModel } from "@/components/Users/models";
import { AppRoutes } from "./Routers/AppRouter";
import { INavItem } from "@/components/Common/Sidebar/Sidebar";
import { pluginMap } from "./pluginMap";

// Define the available plugins
export type AvailablePlugin = "@apps/care_livekit_fe";

export type AvailablePluginManifest = "@app-manifest/care_livekit_fe";

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

type SupportedPluginExtensions =
  | "DoctorConnectButtons"
  | "PatientExternalRegistration";

export type PluginManifest = {
  plugin: string;
  routes: AppRoutes;
  extends: SupportedPluginExtensions[];
  components: PluginComponentMap;
  navItems: INavItem[];
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

export { pluginMap };
