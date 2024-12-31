import { UserBareMinimum } from "@/components/Users/models";

import { Code } from "@/types/questionnaire/code";
import { Quantity } from "@/types/questionnaire/quantity";

export const MEDICATION_ADMINISTRATION_STATUS = [
  "completed",
  "not_done",
  "entered_in_error",
  "stopped",
  "in_progress",
  "on_hold",
  "unknown",
  "cancelled",
] as const;

export type MedicationAdministrationStatus =
  (typeof MEDICATION_ADMINISTRATION_STATUS)[number];

export interface MedicationAdministration {
  readonly id?: string;
  status: MedicationAdministrationStatus;
  status_reason?: Code;
  category?: "inpatient" | "outpatient" | "community" | "discharge";

  medication: Code;

  authored_on?: string; // datetime
  occurrence_period_start: string; // datetime
  occurrence_period_end?: string; // datetime
  recorded?: string; // datetime

  encounter: string; // uuid
  request: string; // uuid

  performer?: {
    actor: string; // uuid
    function: "performer" | "verifier" | "witness";
  }[];
  dosage?: {
    text?: string;
    site?: Code;
    route?: Code;
    method?: Code;
    dose?: Quantity;
    rate?: Quantity;
  };

  note?: string;

  created_by?: UserBareMinimum;
  updated_by?: UserBareMinimum;
}
