import { EncounterRead } from "@/types/emr/encounter/encounter";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { UserReadMinimal } from "@/types/user/user";

export interface Prescription {
  id: string;
  name?: string;
  note?: string;
  status: PrescriptionStatus;
}

export enum PrescriptionStatus {
  // Prescription awaiting dispense
  active = "active",
  // The order moved to dispense state
  completed = "completed",
  // The order was cancelled
  cancelled = "cancelled",
}

export interface PrescriptionCreate extends Omit<Prescription, "id"> {
  alternate_identifier: string;
}

export interface PrescritionList extends Prescription {
  prescribed_by: UserReadMinimal;
  encounter: EncounterRead;
  created_date: string;
}

export interface PrescriptionRead extends Prescription {
  prescribed_by: UserReadMinimal;
  encounter: EncounterRead;
  created_date: string;
  medications: MedicationRequestRead[];
}

export const PRESCRIPTION_STATUS_STYLES = {
  active: "primary",
  completed: "blue",
  cancelled: "destructive",
} as const satisfies Record<PrescriptionStatus, string>;

export interface PrescriptionGroup {
  requests: MedicationRequestRead[];
  prescription: PrescriptionRead;
}
// GroupedPrescription
export interface GroupedPrescription {
  [key: string]: PrescriptionGroup;
}

export function groupMedicationsByPrescription(
  medications: MedicationRequestRead[],
): PrescriptionGroup[] {
  return Object.values(
    medications.reduce<Record<string, PrescriptionGroup>>((acc, medication) => {
      const prescriptionId = medication.prescription?.id || "no_prescription";
      if (!acc[prescriptionId]) {
        acc[prescriptionId] = {
          requests: [],
          prescription: medication.prescription as PrescriptionRead,
        };
      }
      acc[prescriptionId].requests.push(medication);
      return acc;
    }, {}),
  );
}

export interface PrescriptionSummary extends PrescritionList {
  tags: TagConfig[];
}
