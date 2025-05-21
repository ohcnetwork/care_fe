import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { Encounter } from "@/types/emr/encounter";
import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";
import { InventoryRead } from "@/types/inventory/product/inventory";

export enum MedicationDispenseStatus {
  preparation = "preparation",
  in_progress = "in_progress",
  cancelled = "cancelled",
  on_hold = "on_hold",
  completed = "completed",
  entered_in_error = "entered_in_error",
  stopped = "stopped",
  declined = "declined",
}

export enum MedicationDispenseNotPerformedReason {
  outofstock = "outofstock",
  washout = "washout",
  surg = "surg",
  sintol = "sintol",
  sddi = "sddi",
  sdupther = "sdupther",
  saig = "saig",
  preg = "preg",
}

export enum MedicationDispenseCategory {
  inpatient = "inpatient",
  outpatient = "outpatient",
  community = "community",
}

export enum SubstitutionType {
  E = "E",
  EC = "EC",
  BC = "BC",
  G = "G",
  TE = "TE",
  TB = "TB",
  TG = "TG",
  F = "F",
  N = "N",
}

export enum SubstitutionReason {
  CT = "CT",
  FP = "FP",
  OS = "OS",
  RR = "RR",
}

export interface MedicationDispenseSubstitution {
  was_substituted: boolean;
  substitution_type: SubstitutionType;
  reason: SubstitutionReason;
}

export interface MedicationDispenseBase {
  id: string;
  status: MedicationDispenseStatus;
  not_performed_reason?: MedicationDispenseNotPerformedReason;
  category: MedicationDispenseCategory;
  when_prepared: Date;
  when_handed_over?: Date;
  note?: string;
  dosage_instruction: MedicationRequestDosageInstruction[];
  substitution?: MedicationDispenseSubstitution;
}

export interface MedicationDispenseCreate
  extends Omit<MedicationDispenseBase, "id"> {
  encounter: string;
  location?: string;
  authorizing_prescription: string | null;
  item: string;
  quantity: number;
  days_supply: number;
}

export interface MedicationDispenseUpsert
  extends Omit<MedicationDispenseBase, "id"> {
  id?: string;
}

export interface MedicationDispenseRead extends MedicationDispenseBase {
  item: InventoryRead;
  charge_item: ChargeItemRead;
}

export interface MedicationDispenseSummary {
  encounter: Encounter;
  count: number;
}
