import careConfig from "@careConfig";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import { Markdown } from "@/components/ui/markdown";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import PrintTable from "@/components/Common/PrintTable";
import {
  formatDosage,
  formatDuration,
  formatFrequency,
  formatSig,
} from "@/components/Medicine/utils";

import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

export interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

const PrescriptionContent = ({
  prescription,
}: {
  prescription: PrescriptionRead;
}) => {
  const medications = prescription.medications;
  const { t } = useTranslation();

  return (
    <div>
      {/* Prescription Symbol */}
      <div className="text-xl font-semibold mb-3 flex items-end gap-4">
        <p>{t("℞")}</p>
        <p className="text-sm text-gray-600 font-semibold ">
          {formatDateTime(prescription.created_date, "DD/MM/YYYY hh:mm A")}
        </p>
      </div>

      {/* Medications Table */}
      {medications && medications.length > 0 && (
        <div className="mt-4">
          <p className="text-base font-semibold mb-2">{t("medicines")}</p>
          <PrintTable
            headers={[
              { key: "medicine" },
              { key: "dosage" },
              { key: "frequency" },
              { key: "duration" },
              { key: "instructions" },
            ]}
            rows={medications?.map((medication) => {
              const instruction = medication.dosage_instruction[0];
              const remarks = formatSig(instruction);
              const notes = medication.note;
              const freqText = formatFrequency(instruction);
              const additionalInstr =
                instruction?.additional_instruction?.[0]?.display;
              return {
                medicine: displayMedicationName(medication),
                status: t(`medication_status_${medication.status}`),
                dosage: formatDosage(instruction),
                frequency:
                  [freqText, additionalInstr].filter(Boolean).join(", ") || "-",
                duration: formatDuration(instruction) || "-",
                instructions: [remarks, notes].filter(Boolean).join("\n"),
              };
            })}
            className="text-sm font-semibold whitespace-break-spaces text-gray-950"
            cellConfig={{
              medicine: { className: "text-left" },
            }}
          />
        </div>
      )}
      {prescription?.note && (
        <div className="mt-6 mb-6 text-sm text-gray-600">
          <p className="font-semibold mb-1">{t("note")}</p>
          <Markdown
            content={prescription.note}
            prose={false}
            className="text-sm"
          />
        </div>
      )}
      {/* Doctor's Signature */}
      <div className="w-full items-end mt-6 flex flex-row justify-end gap-1">
        <div className="text-right">
          <p className="text-sm text-gray-400">{t("prescribed_by")}</p>
          <p className="text-base text-gray-600 font-semibold">
            {formatName(prescription.prescribed_by)}
          </p>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, isStrong = false }: DetailRowProps) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};

interface PrescriptionPreviewProps {
  prescriptionIds: string[];
  patientId: string;
  facilityId: string;
}

export const PrescriptionPreview = ({
  prescriptionIds,
  patientId,
  facilityId,
}: PrescriptionPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const { prescriptions, isLoading } = useQueries({
    queries: prescriptionIds.map((prescriptionId) => ({
      queryKey: ["prescription", patientId, prescriptionId, facilityId],
      queryFn: query(prescriptionApi.get, {
        pathParams: {
          patientId,
          id: prescriptionId,
        },
        queryParams: { facility: facilityId },
      }),
    })),
    combine: (results) => ({
      prescriptions: results
        .map((r) => r.data)
        .filter((data): data is PrescriptionRead => !!data),
      isLoading: results.some((r) => r.isLoading || r.isFetching),
    }),
  });

  const hasMedications = prescriptions.some(
    (prescription) =>
      prescription.medications && prescription.medications.length > 0,
  );

  const displayDate =
    prescriptions.length === 1 && prescriptions[0].encounter.period.start
      ? format(
          new Date(prescriptions[0].encounter.period.start),
          "dd MMM yyyy, EEEE",
        )
      : null;

  if (isLoading) {
    return <Loading />;
  }

  if (!prescriptions.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_prescriptions_found")}
      </div>
    );
  }

  if (!hasMedications) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  const patient = prescriptions[0].encounter.patient;

  return (
    <PrintPreview
      title={`${t("prescriptions")} - ${patient.name}`}
      autoPrint={{ enabled: hasMedications }}
      disabled={!hasMedications}
    >
      <div className="max-w-5xl mx-auto">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="text-left">
                <h1 className="text-2xl font-medium">{facility?.name}</h1>
                {facility?.address && (
                  <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-sm">
                    {facility.address}
                    {facility.phone_number && (
                      <p className="text-gray-500 text-sm">
                        {t("phone")}: {facility.phone_number}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <QRCodeSVG value={patient.id} size={50} level="Q" marginSize={0} />
            <img
              src={careConfig.mainLogo?.dark}
              alt="Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 text-end"
            />
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 pb-3">
            <div className="space-y-1">
              <DetailRow label={t("patient")} value={patient.name} isStrong />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  patient
                    ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                    : undefined
                }
                isStrong
              />
              {patient.instance_identifiers
                ?.filter(
                  ({ config }) =>
                    config.config.use === PatientIdentifierUse.official,
                )
                .map((identifier) => (
                  <DetailRow
                    key={identifier.config.id}
                    label={identifier.config.config.display}
                    value={identifier.value}
                    isStrong
                  />
                ))}
            </div>
            <div className="space-y-1">
              {prescriptions.length === 1 && (
                <DetailRow label={t("date")} value={displayDate} isStrong />
              )}
              <DetailRow
                label={t("mobile_number")}
                value={patient && formatPhoneNumberIntl(patient.phone_number)}
                isStrong
              />
            </div>
          </div>

          {prescriptions.length > 1 && (
            <div className="mb-4 text-sm text-gray-500 border-b pb-2">
              {t("prescriptions_count", { count: prescriptions.length })}
            </div>
          )}

          {prescriptions.map((prescription, index) => (
            <div key={prescription.id}>
              {index > 0 && (
                <div className="border-t border-dashed border-gray-300 my-6" />
              )}
              <PrescriptionContent prescription={prescription} />
            </div>
          ))}

          {/* Footer */}
          <PrintFooter
            leftContent={t("computer_generated_prescription")}
            className="text-sm"
          />
        </div>
      </div>
    </PrintPreview>
  );
};
