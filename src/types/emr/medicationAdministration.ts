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

export const MEDICATION_ADMINISTRATION_STATUS_REASON_MAP = {
  "242990004": "drug_not_available",
  "182895007": "drug_declined_by_patient",
  "182896008": "drug_declined_by_patient_dislikes_taste",
  "182897004": "drug_declined_by_patient_side_effects",
  "182898009": "drug_declined_by_patient_inconvenient",
  "182899001": "drug_declined_by_patient_problem_swallowing",
  "182900006": "drug_declined_by_patient_patient_beliefs",
  "182901005": "drug_declined_by_patient_alternative_therapy",
  "182902003": "drug_declined_by_patient_cannot_pay_script",
  "182903008": "drug_declined_by_patient_reason_unknown",
};

export const MEDICATION_ADMINISTRATION_STATUS_REASON = Object.keys(
  MEDICATION_ADMINISTRATION_STATUS_REASON_MAP,
);

export type MedicationAdministrationStatusReason =
  keyof typeof MEDICATION_ADMINISTRATION_STATUS_REASON_MAP;

export interface MedicationAdministration {
  readonly id?: string;
  status: MedicationAdministrationStatus;
  status_reason?: MedicationAdministrationStatusReason;
  category?: "inpatient" | "outpatient" | "community" | "discharge";

  medication: Code;

  authored_on?: string; // datetime
  occurrence_period?: {
    start: string; // datetime
    end?: string; // datetime
  };
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
