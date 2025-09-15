import { EncounterRead } from "@/types/emr/encounter/encounter";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
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

export interface PrescriptionSummary extends PrescritionList {
  tags: string[];
}
