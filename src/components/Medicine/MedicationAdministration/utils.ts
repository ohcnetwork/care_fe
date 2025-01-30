import { format } from "date-fns";

import { MedicationAdministrationRequest } from "@/types/emr/medicationAdministration/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

export function createMedicationAdministrationRequest(
  medication: MedicationRequestRead,
  encounterId: string,
): MedicationAdministrationRequest {
  return {
    request: medication.id,
    encounter: encounterId,
    medication: {
      code: medication.medication?.code,
      display: medication.medication?.display,
      system: medication.medication?.system,
    },
    occurrence_period_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    occurrence_period_end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    note: "",
    status: "completed",
    dosage: {
      site: medication.dosage_instruction[0]?.site,
      route: medication.dosage_instruction[0]?.route,
      method: medication.dosage_instruction[0]?.method,
      dose: medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity && {
        value:
          medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity?.value,
        unit: medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity
          ?.unit,
        code: medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity
          ?.unit,
      },
    },
  };
}
