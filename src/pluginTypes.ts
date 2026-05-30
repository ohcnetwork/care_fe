import { NavigationLink } from "@/components/ui/sidebar/nav-main";
import type { OverrideCondition } from "@/lib/override";
import { PluginEncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import { DeviceDetail } from "@/types/device/device";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import { FacilityRead } from "@/types/facility/facility";
import { PlugConfigMeta } from "@/types/plugConfig";
import { UserReadMinimal } from "@/types/user/user";
import { ComponentType, LazyExoticComponent, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { QuestionnaireFormState } from "./components/Questionnaire/QuestionnaireForm";
import { AppRoutes } from "./Routers/AppRouter";

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

export type PatientInfoCardQuickActionsComponentType = React.FC<{
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
  submitForm?: () => void;
}>;

export type PatientDetailsTabDemographyGeneralInfoComponentType = React.FC<{
  facilityId: string;
  patientId: string;
  patientData: PatientRead;
}>;

export type InvoiceRecordPaymentOptionsComponentType = React.FC<{
  facilityId: string;
  invoice: InvoiceRead;
}>;

export type PatientSearchActionsComponentType = React.FC<{
  facilityId: string;
  className?: string;
}>;

export type PatientInfoCardActionsComponentType = React.FC<{
  facilityId: string;
  patient: PatientRead | PatientListRead | PublicPatientRead;
  className?: string;
}>;

export type ServiceRequestComponentType = React.FC<{
  serviceRequestId: string;
}>;

export type EncounterOverviewTopComponentType = React.FC<{
  encounter: EncounterRead;
  patientId: string;
  encounterId: string;
}>;

export type DiagnosticReportOverrideComponentType = React.FC<{
  observationDefinitions: {
    id: string;
    title?: string;
    code?: { code: string; display?: string };
    component?: { code: { code: string; display?: string } }[];
    permitted_unit?: { code: string; display?: string; system?: string } | null;
    permitted_data_type?: string;
  }[];
  handleComponentValueChange: (
    definitionId: string,
    index: number,
    componentCode: string,
    value: string,
    unit: string,
  ) => void;
  handleValueChange: (
    definitionId: string,
    index: number,
    value: string,
  ) => void;
  handleUnitChange: (definitionId: string, index: number, unit: string) => void;
  disabled?: boolean;
}>;

// Define supported plugin components
export type SupportedPluginComponents = {
  DoctorConnectButtons: DoctorConnectButtonComponentType;
  Scribe: ScribeComponentType;
  PatientHomeActions: PatientHomeActionsComponentType;
  PatientInfoCardQuickActions: PatientInfoCardQuickActionsComponentType;
  EncounterActions: EncounterActionsComponentType;
  PatientInfoCardMarkAsComplete: PatientInfoCardMarkAsCompleteComponentType;
  FacilityHomeActions: FacilityHomeActionsComponentType;
  PatientRegistrationForm: PatientRegistrationFormComponentType;
  PatientDetailsTabDemographyGeneralInfo: PatientDetailsTabDemographyGeneralInfoComponentType;
  InvoiceRecordPaymentOptions: InvoiceRecordPaymentOptionsComponentType;
  PatientSearchActions: PatientSearchActionsComponentType;
  PatientInfoCardActions: PatientInfoCardActionsComponentType;
  ServiceRequestAction: ServiceRequestComponentType;
  EncounterOverviewTop: EncounterOverviewTopComponentType;
  DiagnosticReportOverride: DiagnosticReportOverrideComponentType;
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

export type PluginOrganizationTab = {
  name: string;
  slug: string;
  icon: ReactNode;
  component: React.FC<{ contextId: string; navOrganizationId?: string }>;
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

/**
 * Plugin override definition for replacing registered components
 */
export type PluginOverride = {
  /** The key of the component to override (must be registered with register()) */
  component: string;
  /** The replacement component */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replacement: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
  /** Optional conditions for when this override applies */
  condition?: OverrideCondition;
  /** Priority (higher = takes precedence, default 0) */
  priority?: number;
  /** Description for debugging */
  description?: string;
};

type SupportedPluginExtensions =
  | "DoctorConnectButtons"
  | "PatientExternalRegistration";

export type PluginManifest = {
  plugin: string;
  routes?: AppRoutes;
  extends?: readonly SupportedPluginExtensions[];
  navItems?: NavigationLink[];
  billingNavItems?: NavigationLink[];
  userNavItems?: NavigationLink[];
  adminNavItems?: NavigationLink[];
  organizationTabs?: PluginOrganizationTab[];
  components?: PluginComponentMap;
  encounterTabs?: Record<
    string,
    LazyComponent<React.FC<PluginEncounterTabProps>>
  >;
  devices?: readonly PluginDeviceManifest[];
  /** Component overrides provided by this plugin */
  overrides?: readonly PluginOverride[];
};

export type PluginManifestWithMeta = PluginManifest & {
  meta: PlugConfigMeta;
};
