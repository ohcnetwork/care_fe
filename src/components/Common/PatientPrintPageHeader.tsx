import { useTranslation } from "react-i18next";

import { getPatientIdentifiers } from "@/types/emr/patient/patient";
import {
  PatientIdentifier,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

interface Props {
  patient: {
    name: string;
    instance_identifiers?: PatientIdentifier[];
    facility_identifiers?: PatientIdentifier[];
  };
}

// Margin boxes can't clip text and shrink (overlapping) when they don't fit,
// so each box is capped to a length that fits a portrait page.
const MAX_LENGTH = 35;

function marginBox(position: "top-left" | "top-right", text: string) {
  const chars = Array.from(text);
  const content = (
    chars.length > MAX_LENGTH
      ? `${chars.slice(0, MAX_LENGTH - 1).join("")}…`
      : text
  )
    .replace(/[\\"]/g, "\\$&")
    .replace(/[\r\n\f]+/g, " ");
  return `@${position} {
    content: "${content}";
    text-align: ${position === "top-left" ? "left" : "right"};
    vertical-align: bottom;
    padding-bottom: 1.5mm;
    white-space: nowrap;
    font-size: 8pt;
    color: #374151;
  }`;
}

/** Patient name and identifiers, repeated on every printed page after the first. */
export default function PatientPrintPageHeader({ patient }: Props) {
  const { t } = useTranslation();

  const identifiers = getPatientIdentifiers(patient, {
    use: PatientIdentifierUse.official,
  })
    .map(
      (identifier) =>
        `${identifier.config.config.display}: ${identifier.value}`,
    )
    .join(" | ");

  return (
    <style>{`
      @media print {
        @page {
          ${marginBox("top-left", `${t("patient")}: ${patient.name}`)}
          ${identifiers ? marginBox("top-right", identifiers) : ""}
        }
        @page :first {
          @top-left { content: none; }
          @top-right { content: none; }
        }
      }
    `}</style>
  );
}
