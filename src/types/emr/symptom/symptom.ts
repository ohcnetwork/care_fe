import { Code } from "@/types/base/code/code";
import { UserBase } from "@/types/user/user";

export const SYMPTOM_CLINICAL_STATUS = [
  "active",
  "recurrence",
  "relapse",
  "inactive",
  "remission",
  "resolved",
] as const;

export type SymptomClinicalStatus = (typeof SYMPTOM_CLINICAL_STATUS)[number];

export const SYMPTOM_VERIFICATION_STATUS = [
  "unconfirmed",
  "provisional",
  "differential",
  "confirmed",
  "refuted",
  "entered_in_error",
] as const;

export type SymptomVerificationStatus =
  (typeof SYMPTOM_VERIFICATION_STATUS)[number];

export const SYMPTOM_SEVERITY = ["severe", "moderate", "mild"] as const;

export type SymptomSeverity = (typeof SYMPTOM_SEVERITY)[number];

export type Onset = {
  onset_datetime?: string;
  onset_age?: string;
  onset_string?: string;
  note?: string;
};

export interface Symptom {
  id: string;
  code: Code;
  clinical_status: SymptomClinicalStatus;
  verification_status: SymptomVerificationStatus;
  severity: SymptomSeverity;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  created_by: UserBase;
  updated_by: UserBase;
  category: string;
  encounter: string;
  created_date: string;
  updated_date?: string;
}

export interface SymptomRequest {
  id?: string;
  clinical_status: SymptomClinicalStatus;
  verification_status: SymptomVerificationStatus;
  code: Code;
  severity: SymptomSeverity;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  encounter: string;
  category: string;
  created_date?: string;
  updated_date?: string;
  created_by?: UserBase;
}

export const SYMPTOM_CLINICAL_STATUS_COLORS = {
  active: "primary",
  recurrence: "yellow",
  relapse: "destructive",
  inactive: "secondary",
  remission: "blue",
  resolved: "green",
} as const;

export const SYMPTOM_VERIFICATION_STATUS_COLORS = {
  unconfirmed: "yellow",
  provisional: "orange",
  differential: "purple",
  confirmed: "green",
  refuted: "destructive",
  entered_in_error: "destructive",
} as const;

export const SYMPTOM_SEVERITY_COLORS = {
  severe: "destructive",
  moderate: "yellow",
  mild: "blue",
} as const;
