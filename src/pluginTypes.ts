import { LazyExoticComponent } from "react";

import { FacilityModel } from "@/components/Facility/models";
import { UserAssignedModel } from "@/components/Users/models";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { Patient } from "@/types/emr/newPatient";

import { AppRoutes } from "./Routers/AppRouter";
import { pluginMap } from "./pluginMap";

export type DoctorConnectButtonComponentType = React.FC<{
  user: UserAssignedModel;
}>;

export type ScribeComponentType = React.FC;
export type ManageFacilityOptionsComponentType = React.FC<{
  facility?: FacilityModel;
}>;

export type PatientHomeActionsComponentType = React.FC<{
  patient: Patient;
  className?: string;
}>;

// Define supported plugin components
export type SupportedPluginComponents = {
  DoctorConnectButtons: DoctorConnectButtonComponentType;
  Scribe: ScribeComponentType;
  PatientHomeActions: PatientHomeActionsComponentType;
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
  // navItems: INavItem[];
  encounterTabs?: Record<string, LazyComponent<React.FC<EncounterTabProps>>>;
};

export { pluginMap };
