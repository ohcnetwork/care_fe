// [ usual, official, temp, secondary, old ]
export enum PatientIdentifierUse {
  usual = "usual",
  official = "official",
  temp = "temp",
  secondary = "secondary",
  old = "old",
}

export enum PatientIdentifierConfigStatus {
  draft = "draft",
  active = "active",
  inactive = "inactive",
  entered_in_error = "entered_in_error",
}

export const PATIENT_IDENTIFIER_CONFIG_STATUS_COLORS = {
  draft: "secondary",
  active: "green",
  inactive: "destructive",
  entered_in_error: "destructive",
} as const satisfies Record<PatientIdentifierConfigStatus, string>;

export interface RetrieveConfig {
  retrieve_with_dob: boolean;
  retrieve_with_year_of_birth: boolean;
  retrieve_with_otp: boolean;
}

export interface PatientIdentifierConfigData {
  use: PatientIdentifierUse;
  description: string;
  system: string;
  required: boolean;
  unique: boolean;
  regex: string;
  display: string;
  retrieve_config: RetrieveConfig;
  default_value?: string;
  auto_maintained: boolean;
}

export interface PatientIdentifierMeta {
  icon?: string;
}

export interface PatientIdentifierConfig {
  meta?: PatientIdentifierMeta;
  id: string;
  config: PatientIdentifierConfigData;
  status: PatientIdentifierConfigStatus;
  facility?: string;
}

export interface PatientIdentifier {
  config: PatientIdentifierConfig;
  value: string;
}

export type PatientIdentifierConfigCreate = Omit<
  PatientIdentifierConfig,
  "id" | "meta"
>;

export type PatientIdentifierConfigUpdate = Partial<
  Omit<PatientIdentifierConfig, "id" | "meta">
>;

export interface PatientIdentifierConfigBatchResponse {
  results: {
    data?: { patient_identifier_config: PatientIdentifierConfig };
  }[];
}

export function extractPatientIdentifierConfigsFromBatchResponse(
  response: PatientIdentifierConfigBatchResponse,
): PatientIdentifierConfig[] {
  return response.results
    .map((item) => item.data?.patient_identifier_config)
    .filter((item): item is PatientIdentifierConfig => !!item);
}
