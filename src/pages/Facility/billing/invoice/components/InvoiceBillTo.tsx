import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { formatPatientAddress } from "@/components/Patient/utils";

import { PatientRead } from "@/types/emr/patient/patient";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { formatPatientAge } from "@/Utils/utils";

interface InvoiceBillToProps {
  patient: PatientRead;
  verifiedPatient?: PatientRead;
}

export function InvoiceBillTo({
  patient,
  verifiedPatient,
}: InvoiceBillToProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-start pb-4">
      <div>
        <div className="font-medium text-gray-700 text-sm">{t("bill_to")}:</div>
        <p className="font-semibold text-base">
          {patient.name}
          <span className="text-gray-600 ml-2 font-normal">
            ({t(`GENDER__${patient.gender}`)}, {formatPatientAge(patient, true)}
            )
          </span>
        </p>
        {verifiedPatient &&
          "instance_identifiers" in verifiedPatient &&
          verifiedPatient.instance_identifiers
            .filter(
              ({ config }) =>
                config.config.use === PatientIdentifierUse.official &&
                !config.config.auto_maintained,
            )
            .map((identifier) => (
              <div
                key={identifier.config.id}
                className="text-base text-gray-700"
              >
                <span>{identifier.config.config.display}: </span>
                <span className="ml-2 font-semibold">{identifier.value}</span>
              </div>
            ))}
        <div className="flex gap-1 font-medium text-gray-700 text-sm mt-1">
          <span>{t("address")}:</span>
          <span className="whitespace-pre-wrap">
            {formatPatientAddress(patient.address) || (
              <span className="text-gray-500">{t("no_address_provided")}</span>
            )}
          </span>
        </div>
      </div>
      <QRCodeSVG value={patient.id} size={100} level="M" marginSize={0} />
    </div>
  );
}
