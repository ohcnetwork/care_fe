import { Code } from "@/types/base/code/code";
import { UserReadMinimal } from "@/types/user/user";

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

export const DIAGNOSIS_SEVERITY = ["severe", "moderate", "mild"] as const;

export type DiagnosisSeverity = (typeof DIAGNOSIS_SEVERITY)[number];

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
  severity: DiagnosisSeverity | null;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  category: DiagnosisCategory;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
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
  severity: DiagnosisSeverity | null;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  category: DiagnosisCategory;
  encounter: string;
  /**
   * Optional, not deleted — the contract-v1 dirty-row filter, kept ONLY for
   * the still-compiled legacy widget (`QuestionTypes/DiagnosisQuestion.tsx`,
   * five write sites: `:98,319,464,497,531`) and its now-removed
   * `buildRequests` filter. The contract-v2 port
   * (`structured/types/diagnosis/model.ts`) derives dirtiness from the edit
   * log instead and never reads or writes this field. Deleted for real in
   * the Phase 5 legacy-deletion batch, alongside the widget itself — see
   * `docs/superpowers/plans/2026-08-05-final-push.md` Batch E item 4.
   */
  dirty?: boolean;
  created_by?: UserReadMinimal;
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

export const DIAGNOSIS_SEVERITY_COLORS = {
  severe: "destructive",
  moderate: "yellow",
  mild: "blue",
} as const;
