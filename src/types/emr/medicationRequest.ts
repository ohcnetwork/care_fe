import { UserBareMinimum } from "@/components/Users/models";

import { Code } from "@/types/questionnaire/code";

export const DOSAGE_UNITS = [
  "mg",
  "g",
  "ml",
  "drop(s)",
  "ampule(s)",
  "tsp",
  "mcg",
  "unit(s)",
] as const;

export const BOUNDS_DURATION_UNITS = [
  // TODO: Are these smaller units required?
  // "ms",
  // "s,
  // "min",
  "h",
  "d",
  "wk",
  "mo",
  "a",
] as const;

export const MEDICATION_REQUEST_STATUS = [
  "active",
  "on-hold",
  "ended",
  "stopped",
  "completed",
  "cancelled",
  "entered-in-error",
  "draft",
  "unknown",
] as const;

export type MedicationRequestStatus =
  (typeof MEDICATION_REQUEST_STATUS)[number];

export const MEDICATION_REQUEST_STATUS_REASON = [
  "altchoice",
  "clarif",
  "drughigh",
  "hospadm",
  "labint",
  "non_avail",
  "preg",
  "salg",
  "sddi",
  "sdupther",
  "sintol",
  "surg",
  "washout",
] as const;

export type MedicationRequestStatusReason =
  (typeof MEDICATION_REQUEST_STATUS_REASON)[number];

export const MEDICATION_REQUEST_INTENT = [
  "proposal",
  "plan",
  "order",
  "original_order",
  "reflex_order",
  "filler_order",
  "instance_order",
] as const;

export type MedicationRequestIntent =
  (typeof MEDICATION_REQUEST_INTENT)[number];

export interface DosageQuantity {
  value?: number;
  // TODO: confirm if we should be using these units itself.
  unit?: (typeof DOSAGE_UNITS)[number];
}

export interface BoundsDuration {
  value: number;
  unit: (typeof BOUNDS_DURATION_UNITS)[number];
}

export interface DoseRange {
  low: DosageQuantity;
  high: DosageQuantity;
}

export interface Timing {
  repeat?: {
    frequency: number;
    period: number;
    period_unit: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
    bounds_duration?: BoundsDuration;
  };
  code?: Code;
}

export interface MedicationRequestDosageInstruction {
  sequence?: number;
  text?: string;
  additional_instruction?: Code[];
  patient_instruction?: string;
  // TODO: query: how to map for "Immediate" frequency
  // TODO: query how to map Days
  timing?: Timing;
  /**
   * True if it is a PRN medication
   */
  as_needed_boolean?: boolean;
  /**
   * If it is a PRN medication (as_needed_boolean is true), the indicator.
   */
  as_needed_for?: Code;
  site?: Code;
  route?: Code;
  method?: Code;
  /**
   * One of `dose_quantity` or `dose_range` must be present.
   * `type` is optional and defaults to `ordered`.
   *
   * - If `type` is `ordered`, `dose_quantity` must be present.
   * - If `type` is `calculated`, `dose_range` must be present. This is used for titrated medications.
   */
  dose_and_rate?:
    | {
        type?: "ordered";
        dose_quantity?: DosageQuantity;
        dose_range?: undefined;
      }
    | {
        type: "calculated";
        dose_range?: DoseRange;
        dose_quantity?: undefined;
      };
  max_dose_per_period?: DoseRange;
}

export interface MedicationRequest {
  readonly id?: string;
  status?: MedicationRequestStatus;
  status_reason?: MedicationRequestStatusReason;
  status_changed?: string; // DateTime
  intent?: MedicationRequestIntent;
  category?: "inpatient" | "outpatient" | "community" | "discharge";
  priority?: "stat" | "urgent" | "asap" | "routine";
  do_not_perform: boolean;
  medication?: Code;
  patient?: string; // UUID
  encounter?: string; // UUID
  authored_on: string;
  dosage_instruction: MedicationRequestDosageInstruction[];
  note?: string;

  created_by?: UserBareMinimum;
  updated_by?: UserBareMinimum;
}
