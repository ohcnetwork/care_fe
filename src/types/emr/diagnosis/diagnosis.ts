import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export const DIAGNOSIS_CLINICAL_STATUS = [
  "active",
  "recurrence",
  "relapse",
  "inactive",
  "remission",
  "resolved",
] as const;

export type DiagnosisClinicalStatus =
  (typeof DIAGNOSIS_CLINICAL_STATUS)[number];

export const DIAGNOSIS_CATEGORY = [
  "encounter_diagnosis",
  "chronic_condition",
] as const;

export const ACTIVE_DIAGNOSIS_CLINICAL_STATUS = [
  "active",
  "recurrence",
  "relapse",
] as string[];

export const INACTIVE_DIAGNOSIS_CLINICAL_STATUS = [
  "inactive",
  "remission",
  "resolved",
] as const;

export const DIAGNOSIS_VERIFICATION_STATUS = [
  "unconfirmed",
  "provisional",
  "differential",
  "confirmed",
  "refuted",
  "entered_in_error",
] as const;

export type DiagnosisVerificationStatus =
  (typeof DIAGNOSIS_VERIFICATION_STATUS)[number];

export type Onset = {
  onset_datetime?: string;
  onset_age?: string;
  onset_string?: string;
  note?: string;
};

export interface Diagnosis {
  id: string;
  code: Code;
  clinical_status: DiagnosisClinicalStatus;
  verification_status: DiagnosisVerificationStatus;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  category: DiagnosisCategory;
  created_by: UserBase;
  updated_by: UserBase;
  encounter: string;
}

export type DiagnosisCategory = (typeof DIAGNOSIS_CATEGORY)[number];

export interface DiagnosisRequest {
  id?: string;
  clinical_status: DiagnosisClinicalStatus;
  verification_status: DiagnosisVerificationStatus;
  code: Code;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  category: DiagnosisCategory;
  encounter: string;
  dirty: boolean;
}

export const DIAGNOSIS_CLINICAL_STATUS_STYLES = {
  active: "bg-green-100 text-green-800 border-green-200",
  recurrence: "bg-yellow-100 text-yellow-800 border-yellow-200",
  relapse: "bg-red-100 text-red-800 border-red-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  remission: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
} as const;

export const DIAGNOSIS_VERIFICATION_STATUS_STYLES = {
  unconfirmed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  provisional: "bg-orange-100 text-orange-800 border-orange-200",
  differential: "bg-purple-100 text-purple-800 border-purple-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  refuted: "bg-red-100 text-red-800 border-red-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;
