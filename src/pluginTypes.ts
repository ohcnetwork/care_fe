import { FilesTabsProps } from "@/components/Files/FilesTab";
import type { RegisteredGroupDefinition } from "@/components/QuestionnaireV2/groups/registry";
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
import { UserRead, UserReadMinimal } from "@/types/user/user";
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

export type NoteMessageInputComponentType = React.FC<{
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
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
    component?: { code: { code: string; display?: string } }[] | null;
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

export type DeliveryOrderActionsComponentType = React.FC<{
  facilityId: string;
  locationId: string;
}>;

export type UserProfileSectionsComponentType = React.FC<{
  user: UserRead;
  isOwnProfile: boolean;
  className?: string;
}>;

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
  NoteMessageInput: NoteMessageInputComponentType;
  EncounterOverviewTop: EncounterOverviewTopComponentType;
  DiagnosticReportOverride: DiagnosticReportOverrideComponentType;
  PatientHomeQuickActions: PatientHomeActionsComponentType;
  DeliveryOrderActions: DeliveryOrderActionsComponentType;
  UserProfileSections: UserProfileSectionsComponentType;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent<T extends React.FC<any>> = LazyExoticComponent<T>;

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

export type PluginOverride = {
  /** Key the target component was registered under with `register()`. */
  component: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replacement: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
  condition?: OverrideCondition;
  /** Higher wins; default 0. */
  priority?: number;
  description?: string;
};

type SupportedPluginExtensions =
  "DoctorConnectButtons" | "PatientExternalRegistration";

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
  encounterFileTabs?: Record<string, LazyComponent<React.FC<FilesTabsProps>>>;
  devices?: readonly PluginDeviceManifest[];
  overrides?: readonly PluginOverride[];
  /** Registered groups contribute ordinary child questions and their rendering. */
  registeredQuestionGroups?: readonly RegisteredGroupDefinition[];
};

export type PluginManifestWithMeta = PluginManifest & {
  meta: PlugConfigMeta;
};
