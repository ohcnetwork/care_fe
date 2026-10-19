import {
  MedicationRequestDispenseStatus,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";

export const isMedicationDispenseable = (
  medication: MedicationRequestRead | null,
) => {
  if (!medication) {
    // Dispense without medication request is always dispenseable
    return true;
  }

  return (
    medication.dispense_status !== MedicationRequestDispenseStatus.complete
  );
};
