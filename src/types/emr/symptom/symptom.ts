import { Code } from "@/types/questionnaire/code";
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
  created_date?: string;
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

export const SYMPTOM_CLINICAL_STATUS_STYLES = {
  active: "bg-green-100 text-green-800 border-green-200",
  recurrence: "bg-yellow-100 text-yellow-800 border-yellow-200",
  relapse: "bg-red-100 text-red-800 border-red-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  remission: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
} as const;

export const SYMPTOM_VERIFICATION_STATUS_STYLES = {
  unconfirmed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  provisional: "bg-orange-100 text-orange-800 border-orange-200",
  differential: "bg-purple-100 text-purple-800 border-purple-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  refuted: "bg-red-100 text-red-800 border-red-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;

export const SYMPTOM_SEVERITY_STYLES = {
  severe: "bg-red-100 text-red-800 border-red-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  mild: "bg-blue-100 text-blue-800 border-blue-200",
} as const;
