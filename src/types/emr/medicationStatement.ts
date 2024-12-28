import { Period } from "@/types/questionnaire/base";
import { Code } from "@/types/questionnaire/code";

export enum MedicationStatementInformationSourceType {
  PATIENT = "patient",
  USER = "user",
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
