import { Code } from "@/types/base/code/code";
import { DosageQuantity } from "@/types/emr/medicationRequest/medicationRequest";

export const IMMUNIZATION_STATUS = [
  "completed",
  "not_done",
  "draft",
  "entered_in_error",
] as const;

export type ImmunizationStatus = (typeof IMMUNIZATION_STATUS)[number];

export const IMMUNIZATION_STATUS_COLORS = {
  completed: "green",
  not_done: "yellow",
  draft: "secondary",
  entered_in_error: "destructive",
} as const satisfies Record<ImmunizationStatus, string>;

/** HL7 v3 ActReason codes accepted when an immunization was not done. */
export const IMMUNIZATION_NOT_DONE_REASONS = [
  "IMMUNE",
  "MEDPREC",
  "OSTOCK",
  "PATOBJ",
  "PHILISOP",
  "RELIG",
  "VACEFF",
  "VACSAF",
] as const;

export type ImmunizationNotDoneReason =
  (typeof IMMUNIZATION_NOT_DONE_REASONS)[number];

export interface ImmunizationRead {
  id: string;
  status: ImmunizationStatus;
  reason?: ImmunizationNotDoneReason | null;
  code: Code;
  occurrence?: string | null;
  primary_source: boolean;
  site?: Code | null;
  route?: Code | null;
  dose_quantity?: DosageQuantity | null;
  note?: string | null;
  is_subpotent?: boolean | null;
  subpotent_reason?: string | null;
}

/** Optional fields are omitted rather than sent as null. */
export interface ImmunizationWrite {
  status: ImmunizationStatus;
  reason?: ImmunizationNotDoneReason;
  code: Code;
  occurrence?: string;
  primary_source: boolean;
  site?: Code;
  route?: Code;
  dose_quantity?: DosageQuantity;
  note?: string;
  is_subpotent?: boolean;
  subpotent_reason?: string;
  recommendation?: string;
  product?: string;
  location?: string;
  /** Username of the practitioner who administered the dose. */
  administered_by?: string;
}

export interface ImmunizationCreate extends ImmunizationWrite {
  encounter: string;
}
