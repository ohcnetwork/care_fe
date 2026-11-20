import { format } from "date-fns";
import type { TFunction } from "i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import {
  type PatientRead,
  getPatientIdentifiers,
} from "@/types/emr/patient/patient";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { formatPatientAge } from "@/Utils/utils";

export interface PrintDetailRow {
  label: string;
  value: string | null;
}

export interface PrintPatientHeader {
  name: string;
  identifiers: { label: string; value: string }[];
}

export function buildPatientHeader(patient: PatientRead): PrintPatientHeader {
  return {
    name: patient.name,
    identifiers: getPatientIdentifiers(patient, {
      use: PatientIdentifierUse.official,
    }).map((identifier) => ({
      label: identifier.config.config.display,
      value: identifier.value,
    })),
  };
}

export function buildPatientDetailRows(
  patient: PatientRead,
  t: TFunction,
): PrintDetailRow[] {
  return [
    { label: t("patient"), value: patient.name },
    {
      label: `${t("age")} / ${t("sex")}`,
      value: `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`,
    },
    ...buildPatientHeader(patient).identifiers.map(({ label, value }) => ({
      label,
      value,
    })),
  ];
}

export function buildDateRow(t: TFunction): PrintDetailRow {
  return { label: t("date"), value: format(new Date(), "dd MMM yyyy, EEEE") };
}

export function buildMobileRow(
  patient: PatientRead,
  t: TFunction,
): PrintDetailRow {
  return {
    label: t("mobile_number"),
    value: patient.phone_number
      ? formatPhoneNumberIntl(patient.phone_number)
      : null,
  };
}

export function buildGeneratedFooter(t: TFunction) {
  return {
    left: t("computer_generated_document"),
    right: `${t("generated_on")} ${format(new Date(), "PPP 'at' p")}`,
  };
}
