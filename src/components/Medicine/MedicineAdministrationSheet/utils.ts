import { MedicationRequest } from "@/types/emr/medicationRequest";

export function isMedicationDiscontinued(medicationRequest: MedicationRequest) {
  return ["completed", "ended", "stopped", "cancelled"].includes(
    medicationRequest.status!,
  );
}
