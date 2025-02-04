import { UserBareMinimum } from "@/components/Users/models";

import { DosageQuantity } from "@/types/emr/medicationRequest";
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
  category?: "inpatient" | "outpatient" | "community";

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
    dose?: DosageQuantity;
    rate?: Quantity;
  };

  note?: string;

  created_by?: UserBareMinimum;
  updated_by?: UserBareMinimum;
}

export interface MedicationAdministrationRequest {
  id?: string;
  encounter: string;
  request: string;
  status: MedicationAdministrationStatus;
  status_reason?: Code;
  medication: Code;
  occurrence_period_start: string;
  occurrence_period_end?: string;
  recorded?: string;
  note?: string;
  dosage?: {
    text?: string;
    site?: Code;
    route?: Code;
    method?: Code;
    dose?: DosageQuantity;
    rate?: Quantity;
  };
}

export interface MedicationAdministrationRead {
  id: string;
  status: MedicationAdministrationStatus;
  status_reason?: Code;
  medication: Code;
  occurrence_period_start: string;
  occurrence_period_end?: string;
  recorded?: string;
  encounter: string;
  request: string;
  note?: string;
  dosage?: {
    text?: string;
    site?: Code;
    route?: Code;
    method?: Code;
    dose?: DosageQuantity;
    rate?: Quantity;
  };
}
