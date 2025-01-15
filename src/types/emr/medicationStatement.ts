import { UserBareMinimum } from "@/components/Users/models";

import { Period } from "@/types/questionnaire/base";
import { Code } from "@/types/questionnaire/code";

export enum MedicationStatementInformationSourceType {
  PATIENT = "patient",
  PRACTITIONER = "practitioner",
  RELATED_PERSON = "related_person",
}

export const MEDICATION_STATEMENT_STATUS = [
  "active",
  "on_hold",
  "completed",
  "stopped",
  "unknown",
  "entered_in_error",
  "not_taken",
  "intended",
] as const;

export type MedicationStatementStatus =
  (typeof MEDICATION_STATEMENT_STATUS)[number];

export type MedicationStatement = {
  readonly id: string;
  status: MedicationStatementStatus;
  reason?: string;

  medication: Code;
  dosage_text?: string;
  effective_period?: Period;

  patient: string; // UUID
  encounter: string; // UUID

  information_source?: MedicationStatementInformationSourceType;

  note?: string;
};

export type MedicationStatementRead = {
  id: string;
  status: MedicationStatementStatus;
  reason?: string;
  medication: Code;
  dosage_text?: string;
  effective_period?: Period;
  encounter: string;
  information_source?: MedicationStatementInformationSourceType;
  note?: string;
  created_at: string;
  modified_at: string;
  created_by: UserBareMinimum;
  updated_by: UserBareMinimum;
};
