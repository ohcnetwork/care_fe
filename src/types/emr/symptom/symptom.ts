import { Code } from "../../questionnaire/code";
import { UserBase } from "../../user/user";

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
  "entered-in-error",
] as const;

export type SymptomVerificationStatus =
  (typeof SYMPTOM_VERIFICATION_STATUS)[number];

export const SYMPTOM_SEVERITY = ["severe", "moderate", "mild"] as const;

export type SymptomSeverity = (typeof SYMPTOM_SEVERITY)[number];

type Onset = {
  onset_datetime?: string;
  onset_age?: string;
  onset_string?: string;
  note?: string;
};

export interface Symptom {
  code: Code;
  clinical_status: SymptomClinicalStatus;
  verification_status: SymptomVerificationStatus;
  severity?: SymptomSeverity;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  created_by: UserBase;
  updated_by: UserBase;
}

export interface SymptomRequest {
  clinical_status: SymptomClinicalStatus;
  verification_status: SymptomVerificationStatus;
  code: Code;
  severity?: SymptomSeverity;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  encounter: string;
}
