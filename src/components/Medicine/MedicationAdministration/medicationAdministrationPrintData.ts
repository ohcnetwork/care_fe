import { format } from "date-fns";
import type { TFunction } from "i18next";

import { formatDosage, formatFrequency } from "@/components/Medicine/utils";

import {
  type PrintPatientHeader,
  buildGeneratedFooter,
  buildPatientHeader,
} from "@/print/patientDetails";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import type { MedicationAdministrationRead } from "@/types/emr/medicationAdministration/medicationAdministration";
import type { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import type { AdministrableProductType } from "@/types/inventory/productKnowledge/productKnowledge";
import { formatPatientAge } from "@/Utils/utils";

export interface GroupedMedication {
  productId: string;
  productName: string;
  requests: MedicationRequestRead[];
  isPRN: boolean;
  hasActiveRequests: boolean;
}

export interface TimeSlot {
  label: string;
  start: number;
  end: number;
}

/** Administrations by request ID, date (`yyyy-MM-dd`) and time slot label. */
export type AdministrationIndex = Record<
  string,
  Record<string, Record<string, MedicationAdministrationRead[]>>
>;

export interface MedicationAdministrationPrintContent {
  labels: Record<string, string>;
  patient: PrintPatientHeader;
  title: string;
  info: { patient_name: string; age_sex: string; encounter_date: string };
  slot_labels: string[];
  sections: {
    title: string;
    prn: boolean;
    /** One chart per week. */
    ranges: {
      label: string;
      days: { weekday: string; date: string }[];
      rows: {
        name: string;
        summaries: string[];
        orders: string | null;
        /** Administrations per day and slot, day by day. */
        counts: number[];
      }[];
    }[];
  }[];
  footer: { left: string; right: string };
}

export function buildMedicationAdministrationPrintContent({
  encounter,
  groupedMedications,
  dateRanges,
  adminIndex,
  timeSlots,
  isMedication,
  productType,
  t,
}: {
  encounter: EncounterRead;
  groupedMedications: {
    regular: GroupedMedication[];
    prn: GroupedMedication[];
  };
  dateRanges: Date[][];
  adminIndex: AdministrationIndex;
  timeSlots: TimeSlot[];
  isMedication: boolean;
  productType: AdministrableProductType;
  t: TFunction;
}): MedicationAdministrationPrintContent {
  const buildSection = (
    title: string,
    groups: GroupedMedication[],
    prn: boolean,
  ) => ({
    title,
    prn,
    ranges: dateRanges.map((dates) => ({
      label: `${format(dates[0], "dd MMM yyyy")} – ${format(dates[dates.length - 1], "dd MMM yyyy")}`,
      days: dates.map((date) => ({
        weekday: format(date, "EEE"),
        date: format(date, "dd/MM"),
      })),
      rows: groups.map((group) => {
        const instructions = group.requests[0].dosage_instruction;
        return {
          name: group.productName,
          summaries: instructions
            .map((di) =>
              [
                formatDosage(di),
                di.route?.display,
                prn ? t("as_needed") : formatFrequency(di),
              ]
                .filter(Boolean)
                .join(" · "),
            )
            .filter(Boolean),
          orders:
            group.requests.length > 1
              ? `(${group.requests.length} ${t("orders")})`
              : null,
          counts: dates.flatMap((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            return timeSlots.map((slot) =>
              group.requests.reduce(
                (total, request) =>
                  total +
                  (adminIndex[request.id]?.[dateKey]?.[slot.label]?.length ??
                    0),
                0,
              ),
            );
          }),
        };
      }),
    })),
  });

  const sections = [
    groupedMedications.regular.length > 0 &&
      buildSection(
        isMedication
          ? t("regular_medications")
          : t("regular_nutritional_products"),
        groupedMedications.regular,
        false,
      ),
    groupedMedications.prn.length > 0 &&
      buildSection(
        `${isMedication ? t("prn_medications") : t("prn_nutritional_products")} (${t("as_needed")})`,
        groupedMedications.prn,
        true,
      ),
  ].filter((section) => section !== false);

  return {
    labels: {
      patient: t("patient"),
      patient_name: t("patient_name"),
      age_sex: `${t("age")} / ${t("sex")}`,
      encounter_date: t("encounter_date"),
      product: t(productType),
    },
    patient: buildPatientHeader(encounter.patient),
    title: isMedication
      ? t("medication_administration_record")
      : t("nutritional_product_administration_record"),
    info: {
      patient_name: encounter.patient.name,
      age_sex: `${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`,
      encounter_date: encounter.period?.start
        ? format(new Date(encounter.period.start), "dd MMM yyyy")
        : "",
    },
    slot_labels: timeSlots.map((slot) => slot.label.slice(0, 2)),
    sections,
    footer: {
      ...buildGeneratedFooter(t),
      left: isMedication
        ? t("computer_generated_medication_administration")
        : t("computer_generated_nutritional_product_administration"),
    },
  };
}
