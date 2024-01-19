import { PerformedByModel } from "../HCX/misc";
import { PRESCRIPTION_ROUTES } from "./CreatePrescriptionForm";

export const DOSAGE_UNITS = [
  "mg",
  "g",
  "ml",
  "drop(s)",
  "ampule(s)",
  "tsp",
] as const;

export type DosageValue = `${number} ${(typeof DOSAGE_UNITS)[number]}`;

interface BasePrescription {
  readonly id: string;
  medicine?: string;
  medicine_object?: MedibaseMedicine;
  medicine_old?: string;
  route?: (typeof PRESCRIPTION_ROUTES)[number];
  dosage: DosageValue;
  notes?: string;
  meta?: object;
  readonly prescription_type?: "DISCHARGE" | "REGULAR";
  readonly discontinued: boolean;
  discontinued_reason?: string;
  readonly prescribed_by: PerformedByModel;
  readonly discontinued_date: string;
  readonly last_administered_on?: string;
  readonly is_migrated: boolean;
  readonly created_date: string;
  readonly modified_date: string;
}

export interface NormalPrescription extends BasePrescription {
  frequency:
    | "STAT"
    | "OD"
    | "HS"
    | "BD"
    | "TID"
    | "QID"
    | "Q4H"
    | "QOD"
    | "QWK";
  days?: number;
  is_prn: false;
  indicator?: undefined;
  max_dosage?: undefined;
  min_hours_between_doses?: undefined;
}

export interface PRNPrescription extends BasePrescription {
  indicator: string;
  max_dosage?: DosageValue;
  min_hours_between_doses?: number;
  is_prn: true;
  frequency?: undefined;
  days?: undefined;
}

export type Prescription = NormalPrescription | PRNPrescription;

export type MedicineAdministrationRecord = {
  readonly id: string;
  readonly prescription: Prescription;
  notes: string;
  administered_date?: string;
  readonly administered_by: PerformedByModel;
  readonly archived_by: PerformedByModel | undefined;
  readonly archived_on: string | undefined;
  readonly created_date: string;
  readonly modified_date: string;
};

export type MedibaseMedicine = {
  id: string;
  name: string;
  type: "brand" | "generic";
  company?: string;
  contents: string;
  cims_class: string;
  atc_classification?: string;
  generic?: string;
};
