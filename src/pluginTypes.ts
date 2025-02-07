import { LazyExoticComponent } from "react";
import { UseFormReturn } from "react-hook-form";

import { UserAssignedModel } from "@/components/Users/models";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

import { AppRoutes } from "./Routers/AppRouter";
import { QuestionnaireFormState } from "./components/Questionnaire/QuestionnaireForm";
import { pluginMap } from "./pluginMap";
import { FacilityData } from "./types/facility/facility";

export type DoctorConnectButtonComponentType = React.FC<{
  user: UserAssignedModel;
}>;

export type ScribeComponentType = React.FC<{
  formState: QuestionnaireFormState[];
  setFormState: React.Dispatch<React.SetStateAction<QuestionnaireFormState[]>>;
}>;

export type PatientHomeActionsComponentType = React.FC<{
  patient: Patient;
  className?: string;
}>;

export type PatientInfoCardActionsComponentType = React.FC<{
  encounter: Encounter;
  className?: string;
}>;

export type FacilityHomeActionsComponentType = React.FC<{
  facility: FacilityData;
  className?: string;
}>;

export type PatientRegistrationFormComponentType = React.FC<{
  form: UseFormReturn<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  patientId?: string;
}>;

export type PatientDetailsTabDemographyGeneralInfoComponentType = React.FC<{
  facilityId: string;
  patientId: string;
  patientData: Patient;
}>;

// Define supported plugin components
export type SupportedPluginComponents = {
  DoctorConnectButtons: DoctorConnectButtonComponentType;
  Scribe: ScribeComponentType;
  PatientHomeActions: PatientHomeActionsComponentType;
  PatientInfoCardActions: PatientInfoCardActionsComponentType;
  FacilityHomeActions: FacilityHomeActionsComponentType;
  PatientRegistrationForm: PatientRegistrationFormComponentType;
  PatientDetailsTabDemographyGeneralInfo: PatientDetailsTabDemographyGeneralInfoComponentType;
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
