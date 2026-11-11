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

/** Patient name and identifiers, repeated on every printed page after the first. */
export default function PatientPrintPageHeader({ patient }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-baseline justify-between gap-x-4 border-b border-gray-300 pb-1 mb-2 text-[10px] text-gray-700">
      <span className="truncate">
        {t("patient")}: {patient.name}
      </span>
      <span className="truncate">
        {getPatientIdentifiers(patient, { use: PatientIdentifierUse.official })
          .map(
            (identifier) =>
              `${identifier.config.config.display}: ${identifier.value}`,
          )
          .join(" | ")}
      </span>
    </div>
  );
}
