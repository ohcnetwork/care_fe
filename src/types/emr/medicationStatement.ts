import { Badge } from "@/components/ui/badge";

import { Code } from "@/types/base/code/code";
import { Period } from "@/types/questionnaire/base";
import { UserReadMinimal } from "@/types/user/user";

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
  active: "primary",
  completed: "blue",
  stopped: "destructive",
  on_hold: "yellow",
  intended: "indigo",
  not_taken: "secondary",
  unknown: "secondary",
  entered_in_error: "destructive",
} as const satisfies Record<
  MedicationStatementStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

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
  created_by?: UserReadMinimal;
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
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
};
