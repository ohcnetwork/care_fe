import { format } from "date-fns";
import type { TFunction } from "i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import {
  formatAdditionalInstructions,
  formatDosage,
  formatDuration,
  formatFrequency,
  formatSig,
} from "@/components/Medicine/utils";

import {
  type PrintDetailRow,
  type PrintPatientHeader,
  buildPatientDetailRows,
  buildPatientHeader,
} from "@/print/patientDetails";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { getLocationPath } from "@/types/location/utils";
import { formatDateTime, formatName } from "@/Utils/utils";

export interface PrescriptionsPrintContent {
  labels: Record<string, string>;
  patient: PrintPatientHeader;
  details: {
    left: PrintDetailRow[];
    right: PrintDetailRow[];
    location: PrintDetailRow | null;
  };
  qr_code: string | null;
  count_text: string | null;
  table_header: string[];
  prescriptions: {
    symbol: string;
    title: string;
    progress: string | null;
    date: string;
    prescribed_by: string;
    /** Markdown is not rendered; the text is shown as written. */
    note: string | null;
    medications: {
      index: string;
      name: string;
      instructions: {
        dosage: string;
        frequency: string;
        duration: string;
        text: string;
      }[];
      /** Only for medications with several instructions; otherwise it is part of the instruction text. */
      note: string | null;
    }[];
  }[];
  footer: string;
}

export function buildPrescriptionsPrintContent({
  prescriptions,
  patient,
  qrCodePath,
  t,
}: {
  prescriptions: PrescriptionRead[];
  patient: PatientRead;
  qrCodePath: string | null;
  t: TFunction;
}): PrescriptionsPrintContent {
  const single = prescriptions.length === 1 ? prescriptions[0] : undefined;
  const encounterStart = single?.encounter.period.start;
  const identifierRows = buildPatientDetailRows(patient, t).slice(2);
  const [patientRow, ageSexRow] = buildPatientDetailRows(patient, t);

  return {
    labels: {
      patient: t("patient"),
      prescribed_by: t("prescribed_by"),
      note: t("note"),
    },
    patient: buildPatientHeader(patient),
    details: {
      left: [
        patientRow,
        ageSexRow,
        {
          label: t("mobile_number"),
          value: patient.phone_number
            ? formatPhoneNumberIntl(patient.phone_number)
            : null,
        },
      ],
      right: [
        ...identifierRows,
        ...(single
          ? [
              {
                label: t("encounter_date"),
                value: encounterStart
                  ? format(new Date(encounterStart), "dd MMM yyyy, EEEE")
                  : null,
              },
            ]
          : []),
      ],
      location: single?.encounter.current_location
        ? {
            label: t("patient_location"),
            value: getLocationPath(single.encounter.current_location),
          }
        : null,
    },
    qr_code: qrCodePath,
    count_text:
      prescriptions.length > 1
        ? t("prescriptions_count", { count: prescriptions.length })
        : null,
    table_header: [
      t("hash_tag"),
      t("medicine"),
      t("dosage"),
      t("frequency"),
      t("duration"),
      t("instructions"),
    ],
    prescriptions: prescriptions.map((prescription, index) => ({
      // The ℞ glyph is not in the print fonts.
      symbol: "Rx",
      title: t("medicine_instructions"),
      progress:
        prescriptions.length > 1
          ? `[${t("x_of_y", { current: index + 1, total: prescriptions.length })}]`
          : null,
      date: formatDateTime(
        prescription.created_date,
        "DD MMM YYYY, ddd, hh:mm A",
      ),
      prescribed_by: formatName(prescription.prescribed_by),
      note: prescription.note || null,
      medications: (prescription.medications ?? []).map(
        (medication, medIndex) => {
          const instructions = medication.dosage_instruction;
          const isMulti = instructions.length > 1;
          const noteText = medication.note
            ? `${t("note")}: ${medication.note}`
            : undefined;
          return {
            index: String(medIndex + 1),
            name: displayMedicationName(medication),
            instructions: instructions.map((di) => ({
              dosage: formatDosage(di) || "",
              frequency: formatFrequency(di) || "",
              duration: formatDuration(di) || "",
              text: [
                formatSig(di),
                formatAdditionalInstructions(di),
                !isMulti ? noteText : undefined,
              ]
                .filter(Boolean)
                .join("\n\n"),
            })),
            note: isMulti && noteText ? noteText : null,
          };
        },
      ),
    })),
    footer: `${t("computer_generated_prescription")} | ${formatDateTime(new Date(), "MMMM D, YYYY [at] h:mm A")}`,
  };
}
