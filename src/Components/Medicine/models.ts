import { PerformedByModel } from "../HCX/misc";

interface BasePrescription {
  id: string;
  medicine: string;
  route: "ORAL" | "IV" | "IM" | "SC";
  dosage: string;
  notes: string;
  meta: object;
  prescribed_by: PerformedByModel;
  prescription_type: "DISCHARGE" | "REGULAR";
  discontinued: boolean;
  discontinued_reason: string;
  discontinued_date: string;
  is_migrated: boolean;
  created_date: string;
  modified_date: string;
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
  days: number;
  is_prn: false;
}

export interface PRNPrescription extends BasePrescription {
  indicator: string;
  max_dosage: string;
  min_hours_between_doses: number;
  is_prn: true;
}

export type Prescription = NormalPrescription | PRNPrescription;

export type MedicineAdministrationRecord = {
  id: string;
  prescription: Prescription;
  notes: string;
  administered_by: PerformedByModel;
  administered_date: string;
  created_date: string;
  modified_date: string;
};
