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

export const MEDICATION_STATEMENT_STATUS_STYLES = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  stopped: "bg-red-100 text-red-800 border-red-200",
  on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  intended: "bg-purple-100 text-purple-800 border-purple-200",
  not_taken: "bg-gray-100 text-gray-800 border-gray-200",
  unknown: "bg-gray-100 text-gray-800 border-gray-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;

export type MedicationStatement = {
  readonly id: string;
  status: MedicationStatementStatus;
  reason?: string;

  medication: Code;
  dosage_text: string;
  effective_period?: Period;

  patient: string; // UUID
  encounter: string; // UUID

  information_source: MedicationStatementInformationSourceType;

  note?: string;
};

export type MedicationStatementRequest = {
  id?: string;
  status: MedicationStatementStatus;
  reason?: string;
  medication: Code;
  encounter?: string; // UUID
  dosage_text: string;
  effective_period?: Period;
  information_source: MedicationStatementInformationSourceType;
  note?: string;
  created_by?: UserBareMinimum;
};

export type MedicationStatementRead = {
  id: string;
  status: MedicationStatementStatus;
  reason?: string;
  medication: Code;
  dosage_text: string;
  effective_period?: Period;
  encounter: string;
  information_source: MedicationStatementInformationSourceType;
  note?: string;
  created_date: string;
  modified_date: string;
  created_by: UserBareMinimum;
  updated_by: UserBareMinimum;
};
