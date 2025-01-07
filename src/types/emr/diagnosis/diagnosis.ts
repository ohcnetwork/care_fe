import { Code } from "../../questionnaire/code";
import { UserBase } from "../../user/user";

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

export const DIAGNOSIS_VERIFICATION_STATUS = [
  "unconfirmed",
  "provisional",
  "differential",
  "confirmed",
  "refuted",
  "entered-in-error",
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
  code: Code;
  clinical_status: DiagnosisClinicalStatus;
  verification_status: DiagnosisVerificationStatus;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  created_by: UserBase;
  updated_by: UserBase;
}

export interface DiagnosisRequest {
  clinical_status: DiagnosisClinicalStatus;
  verification_status: DiagnosisVerificationStatus;
  code: Code;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  encounter: string;
}
