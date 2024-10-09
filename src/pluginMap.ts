import { lazy, LazyExoticComponent } from "react";
import { UserAssignedModel } from "./Components/Users/models";
import { AppRoutes } from "./Routers/AppRouter";
import { INavItem } from "./Components/Common/Sidebar/Sidebar";

// Define the available plugins
export type AvailablePlugin = "@apps/care-livekit";

export type AvailablePluginManifest = "@app-manifest/care-livekit";

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

export const careApps: Promise<PluginManifest>[] = [
  import("@app-manifest/care-livekit").then(
    (module) => module.default,
  ) as Promise<PluginManifest>,
];

// Create a type that ensures only available plugins can be used
export type EnabledPluginConfig = {
  plugin: string;
  manifestPath: AvailablePluginManifest;
  path: AvailablePlugin;
  manifest: Promise<PluginManifest>;
  // Components are a dictionary, with the key being the component name, and the value being the component type
  components: PluginComponentMap;
};

const careLivekitM = import("@app-manifest/care-livekit").then(
  (module) => module.default,
) as Promise<PluginManifest>;
const LiveKitDoctorConnectButtons = lazy(() =>
  import("@apps/care-livekit").then((module) => ({
    default: module.DoctorConnectButtons,
  })),
);

const pluginMap: EnabledPluginConfig[] = [
  {
    plugin: "care-livekit",
    path: "@apps/care-livekit",
    manifestPath: "@app-manifest/care-livekit",
    manifest: careLivekitM,
    components: {
      DoctorConnectButtons: LiveKitDoctorConnectButtons,
    },
  },
];

export { pluginMap };
