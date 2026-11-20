import { format } from "date-fns";
import type { TFunction } from "i18next";

import {
  formatDosage,
  formatFrequency,
  joinInstructionTexts,
} from "@/components/Medicine/utils";

import type { DetailsTablePrintContent } from "@/print/detailsTable";
import {
  buildDateRow,
  buildGeneratedFooter,
  buildMobileRow,
  buildPatientDetailRows,
  buildPatientHeader,
} from "@/print/patientDetails";
import type { DispenseOrderRead } from "@/types/emr/dispenseOrder/dispenseOrder";
import type { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import type { PatientRead } from "@/types/emr/patient/patient";
import { round } from "@/Utils/decimal";

/** Between the instructions of one dispense; box-drawing dashes aren't in the print font. */
const INSTRUCTION_SEPARATOR = "\n–\n";

export function buildDispenseOrderPrintContent({
  dispenseOrder,
  dispenses,
  patient,
  t,
}: {
  dispenseOrder: DispenseOrderRead;
  dispenses: MedicationDispenseRead[];
  patient: PatientRead;
  t: TFunction;
}): DetailsTablePrintContent {
  return {
    heading: t("dispense_order"),
    patient: buildPatientHeader(patient),
    patient_label: t("patient"),
    details: {
      left: buildPatientDetailRows(patient, t),
      right: [
        buildDateRow(t),
        buildMobileRow(patient, t),
        { label: t("location"), value: dispenseOrder.location.name },
      ],
    },
    title: dispenseOrder.name ?? null,
    note: dispenseOrder.note || null,
    table_title: t("medication_dispenses"),
    table: {
      header: [
        t("medicine"),
        t("dosage"),
        t("frequency"),
        t("quantity"),
        t("lot_batch_number"),
        t("expiry_date"),
        t("prepared_date"),
      ],
      rows: dispenses.map((dispense) => {
        const instructions = dispense.dosage_instruction ?? [];
        return [
          dispense.item.product.product_knowledge.name,
          joinInstructionTexts(
            instructions,
            formatDosage,
            INSTRUCTION_SEPARATOR,
          ),
          joinInstructionTexts(
            instructions,
            formatFrequency,
            INSTRUCTION_SEPARATOR,
          ),
          String(round(dispense.quantity) || "-"),
          dispense.item.product.batch?.lot_number || "-",
          dispense.item.product?.expiration_date
            ? format(
                new Date(dispense.item.product.expiration_date),
                "dd/MM/yyyy",
              )
            : "-",
          new Date(dispense.when_prepared).toLocaleDateString(),
        ];
      }),
    },
    footer: buildGeneratedFooter(t),
  };
}
