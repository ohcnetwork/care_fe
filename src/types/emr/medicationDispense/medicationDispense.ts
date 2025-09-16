import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { LocationList } from "@/types/location/location";

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

export const MEDICATION_DISPENSE_STATUS_COLORS = {
  preparation: "blue",
  in_progress: "yellow",
  cancelled: "destructive",
  on_hold: "orange",
  completed: "green",
  entered_in_error: "secondary",
  stopped: "destructive",
  declined: "purple",
} as const satisfies Record<MedicationDispenseStatus, string>;

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

export const getSubstitutionTypeDisplay = (
  t: (key: string) => string,
  type: SubstitutionType,
) => {
  switch (type) {
    case SubstitutionType.E:
      return t("substitution_type_e_equivalence");
    case SubstitutionType.EC:
      return t("substitution_type_ec_equivalence_clinical");
    case SubstitutionType.BC:
      return t("substitution_type_bc_brand_change");
    case SubstitutionType.G:
      return t("substitution_type_g_generic");
    case SubstitutionType.TE:
      return t("substitution_type_te_therapeutic_equivalence");
    case SubstitutionType.TB:
      return t("substitution_type_tb_therapeutic_brand");
    case SubstitutionType.TG:
      return t("substitution_type_tg_therapeutic_generic");
    case SubstitutionType.F:
      return t("substitution_type_f_formulary");
    case SubstitutionType.N:
      return t("substitution_type_n_none");
    default:
      return type;
  }
};

export const getSubstitutionReasonDisplay = (
  t: (key: string) => string,
  reason: SubstitutionReason,
) => {
  switch (reason) {
    case SubstitutionReason.CT:
      return t("substitution_reason_ct");
    case SubstitutionReason.FP:
      return t("substitution_reason_fp");
    case SubstitutionReason.OS:
      return t("substitution_reason_os");
    case SubstitutionReason.RR:
      return t("substitution_reason_rr");
    default:
      return reason;
  }
};

export const getSubstitutionTypeDescription = (
  t: (key: string) => string,
  type: SubstitutionType,
) => {
  switch (type) {
    case SubstitutionType.E:
      return t("substitution_type_e_description");
    case SubstitutionType.EC:
      return t("substitution_type_ec_description");
    case SubstitutionType.BC:
      return t("substitution_type_bc_description");
    case SubstitutionType.G:
      return t("substitution_type_g_description");
    case SubstitutionType.TE:
      return t("substitution_type_te_description");
    case SubstitutionType.TB:
      return t("substitution_type_tb_description");
    case SubstitutionType.TG:
      return t("substitution_type_tg_description");
    case SubstitutionType.F:
      return t("substitution_type_f_description");
    case SubstitutionType.N:
      return t("substitution_type_n_description");
    default:
      return "";
  }
};

export const getSubstitutionReasonDescription = (
  t: (key: string) => string,
  reason: SubstitutionReason,
) => {
  switch (reason) {
    case SubstitutionReason.CT:
      return t("substitution_reason_ct_description");
    case SubstitutionReason.FP:
      return t("substitution_reason_fp_description");
    case SubstitutionReason.OS:
      return t("substitution_reason_os_description");
    case SubstitutionReason.RR:
      return t("substitution_reason_rr_description");
    default:
      return "";
  }
};

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
  authorizing_request: string | null;
  item: string;
  quantity: number;
  days_supply: number;
  fully_dispensed: boolean;
}

export interface MedicationDispenseUpsert
  extends Omit<MedicationDispenseBase, "id"> {
  id?: string;
}

export interface MedicationDispenseRead extends MedicationDispenseBase {
  item: InventoryRead;
  charge_item: ChargeItemRead;
  created_date: string;
  location: LocationList;
  quantity: number;
}

export interface MedicationDispenseSummary {
  encounter: EncounterRead;
  count: number;
}

export interface MedicationDispenseUpdate {
  id?: string;
  status: MedicationDispenseStatus;
}
