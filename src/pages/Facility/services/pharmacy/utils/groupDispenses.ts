import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";

export interface DispensePrescriptionGroup {
  prescription: PrescriptionRead;
  dispenses: MedicationDispenseRead[];
}

export interface GroupedDispenses {
  prescriptionGroups: DispensePrescriptionGroup[];
  otherDispenses: MedicationDispenseRead[];
}

/**
 * Groups medication dispenses by their authorizing request's prescription.
 * Dispenses without an authorizing request or whose authorizing request has
 * no prescription are returned in `otherDispenses`.
 *
 * Group order is determined by the first appearance of each prescription in
 * the input list.
 */
export function groupDispensesByPrescription(
  dispenses: MedicationDispenseRead[],
): GroupedDispenses {
  const groupsById = new Map<string, DispensePrescriptionGroup>();
  const otherDispenses: MedicationDispenseRead[] = [];

  for (const dispense of dispenses) {
    const prescription = dispense.authorizing_request?.prescription;
    if (!prescription) {
      otherDispenses.push(dispense);
      continue;
    }
    const existing = groupsById.get(prescription.id);
    if (existing) {
      existing.dispenses.push(dispense);
    } else {
      groupsById.set(prescription.id, {
        prescription,
        dispenses: [dispense],
      });
    }
  }

  return {
    prescriptionGroups: Array.from(groupsById.values()),
    otherDispenses,
  };
}
