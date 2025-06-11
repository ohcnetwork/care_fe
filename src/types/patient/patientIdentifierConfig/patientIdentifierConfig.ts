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

export const PATIENT_IDENTIFIER_CONFIG_STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-red-100 text-red-800 border-red-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;

export interface RetrieveConfig {
  retrieve_with_dob: boolean;
  retrieve_with_year_of_birth: boolean;
  retrieve_with_otp: boolean;
  retrieve_without_extra: boolean;
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
}

export interface PatientIdentifierConfig {
  meta: Record<string, any>;
  id: string | null;
  config: PatientIdentifierConfigData;
  status: PatientIdentifierConfigStatus;
  facility: string | null;
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
