import { LazyExoticComponent } from "react";
import { UseFormReturn } from "react-hook-form";

import { NavigationLink } from "@/components/ui/sidebar/nav-main";

import { PluginEncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { DeviceDetail } from "@/types/device/device";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { UserReadMinimal } from "@/types/user/user";

import { AppRoutes } from "./Routers/AppRouter";
import { QuestionnaireFormState } from "./components/Questionnaire/QuestionnaireForm";
import { pluginMap } from "./pluginMap";
import { FacilityRead } from "./types/facility/facility";

export type DoctorConnectButtonComponentType = React.FC<{
  user: UserReadMinimal;
}>;

export type ScribeComponentType = React.FC<{
  formState: QuestionnaireFormState[];
  setFormState: React.Dispatch<React.SetStateAction<QuestionnaireFormState[]>>;
}>;

export type PatientHomeActionsComponentType = React.FC<{
  patient: PatientRead;
  facilityId?: string;
  className?: string;
}>;

export type EncounterActionsComponentType = React.FC<{
  encounter: EncounterRead;
  className?: string;
}>;

export type PatientInfoCardMarkAsCompleteComponentType = React.FC<{
  encounter: EncounterRead;
}>;

export type FacilityHomeActionsComponentType = React.FC<{
  facility: FacilityRead;
  className?: string;
}>;

export type PatientRegistrationFormComponentType = React.FC<{
  form: UseFormReturn<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  facilityId?: string;
  patientId?: string;
}>;

export type PatientDetailsTabDemographyGeneralInfoComponentType = React.FC<{
  facilityId: string;
  patientId: string;
  patientData: PatientRead;
}>;

export type PatientSearchComponentType = React.FC<{
  facilityId: string;
  state: UseFormReturn<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}>;

// Define supported plugin components
export type SupportedPluginComponents = {
  DoctorConnectButtons: DoctorConnectButtonComponentType;
  Scribe: ScribeComponentType;
  PatientHomeActions: PatientHomeActionsComponentType;
  EncounterActions: EncounterActionsComponentType;
  PatientInfoCardMarkAsComplete: PatientInfoCardMarkAsCompleteComponentType;
  FacilityHomeActions: FacilityHomeActionsComponentType;
  PatientRegistrationForm: PatientRegistrationFormComponentType;
  PatientDetailsTabDemographyGeneralInfo: PatientDetailsTabDemographyGeneralInfoComponentType;
  PatientSearch: PatientSearchComponentType;
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

export type PluginDeviceManifest = {
  type: string; // This matches the `care_type` of the device
  icon?: React.FC<React.HTMLAttributes<HTMLElement>>;
  configureForm?: React.FC<{
    facilityId: string;
    metadata: Record<string, unknown>;
    onChange: (metadata: Record<string, unknown>) => void;
  }>;
  showPageCard?: React.FC<{ device: DeviceDetail; facilityId: string }>;
  encounterOverview?: React.FC<{ encounter: EncounterRead }>;
};

type SupportedPluginExtensions =
  | "DoctorConnectButtons"
  | "PatientExternalRegistration";

export type PluginManifest = {
  plugin: string;
  routes?: AppRoutes;
  extends?: readonly SupportedPluginExtensions[];
  navItems?: NavigationLink[];
  userNavItems?: NavigationLink[];
  adminNavItems?: NavigationLink[];
  components?: PluginComponentMap;
  encounterTabs?: Record<
    string,
    LazyComponent<React.FC<PluginEncounterTabProps>>
  >;
  devices?: readonly PluginDeviceManifest[];
};

export { pluginMap };
