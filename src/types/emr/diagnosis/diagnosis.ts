import { Code } from "@/types/base/code/code";
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
  created_date: string;
  updated_date?: string;
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
  created_by?: UserBase;
  created_date?: string;
  updated_date?: string;
}

export const DIAGNOSIS_CLINICAL_STATUS_COLORS = {
  active: "primary",
  recurrence: "yellow",
  relapse: "destructive",
  inactive: "secondary",
  remission: "blue",
  resolved: "green",
} as const;

export const DIAGNOSIS_VERIFICATION_STATUS_COLORS = {
  unconfirmed: "yellow",
  provisional: "orange",
  differential: "purple",
  confirmed: "green",
  refuted: "destructive",
  entered_in_error: "destructive",
} as const;
