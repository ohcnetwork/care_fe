import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import { Markdown } from "@/components/ui/markdown";

import Loading from "@/components/Common/Loading";
import PrintTable from "@/components/Common/PrintTable";
import {
  formatDosage,
  formatDuration,
  formatFrequencyWithInstructions,
  formatSig,
} from "@/components/Medicine/utils";

import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";
import { cn } from "@/lib/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import { getLocationPath } from "@/types/location/utils";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

export interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

const PrescriptionContent = ({
  prescription,
  prescriptionIndex,
  totalCount,
}: {
  prescription: PrescriptionRead;
  prescriptionIndex: number;
  totalCount: number;
}) => {
  const medications = prescription.medications;
  const { t } = useTranslation();

  return (
    <div>
      {/* Prescription Symbol */}
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-base text-gray-950">{t("℞")}</span>
          <span className="font-semibold text-sm print:text-xs uppercase text-gray-950">
            {t("medicine_instructions")}
          </span>
          {totalCount > 1 && (
            <span className="text-sm print:text-xs text-gray-700 font-medium">
              [
              {t("x_of_y", {
                current: prescriptionIndex + 1,
                total: totalCount,
              })}
              ]
            </span>
          )}
        </div>
        <span className="text-sm print:text-xs text-gray-950">
          {formatDateTime(
            prescription.created_date,
            "DD MMM YYYY, ddd, hh:mm A",
          )}
        </span>
      </div>

      <div className="border border-gray-200 rounded-md">
        <div className="relative flex justify-between place-items-end px-4 py-3">
          <div className="absolute top-5 left-0 h-3.5 w-1 bg-gray-400 rounded-r-md"></div>
          <div>
            <p className="text-sm print:text-xs">
              <span className="text-gray-700 font-medium">
                {t("prescribed_by")}:{" "}
              </span>
              <span className="font-semibold text-gray-950">
                {formatName(prescription.prescribed_by)}
              </span>
            </p>
            {prescription.note && (
              <div className="text-xs print:text-[11px] text-gray-700 mt-0.5 flex gap-1">
                {t("note")}:
                <Markdown content={prescription.note} prose={false} />
              </div>
            )}
          </div>
        </div>
        {/* Medications Table */}
        {medications && medications.length > 0 && (
          <PrintTable
            headers={[
              { key: "num" },
              { key: "medicine" },
              { key: "dosage" },
              { key: "schedule" },
              { key: "duration" },
              { key: "instructions" },
            ]}
            rows={medications.flatMap(
              (medication, medIndex): Record<string, string | undefined>[] => {
                const instructions = medication.dosage_instruction;
                const isMulti = instructions.length > 1;
                const totalRows =
                  instructions.length + (medication.note ? 1 : 0);
                const shouldSpan = totalRows > 1;
                return [
                  ...instructions.map((di, idx) => ({
                    _groupedRow:
                      isMulti && idx < instructions.length - 1
                        ? "true"
                        : undefined,
                    _span_num:
                      idx === 0 && shouldSpan ? String(totalRows) : undefined,
                    _span_medicine:
                      idx === 0 && shouldSpan ? String(totalRows) : undefined,
                    num: idx === 0 ? String(medIndex + 1) : "",
                    medicine:
                      idx === 0 ? displayMedicationName(medication) : "",
                    dosage: formatDosage(di) || "",
                    schedule: formatFrequencyWithInstructions(di) || "",
                    duration: formatDuration(di) || "",
                    instructions: formatSig(di) || "",
                  })),
                  ...(medication.note
                    ? [
                        {
                          _fullspan: `${t("note")}: ${medication.note}`,
                        },
                      ]
                    : []),
                ];
              },
            )}
            cellClassName="text-sm print:text-xs wrap-break-word whitespace-break-spaces text-gray-950 font-normal text-left"
            cellConfig={{
              num: { className: "text-center text-gray-600 w-8" },
              medicine: { className: "font-medium max-w-56 min-w-32" },
              dosage: { className: "w-24" },
              duration: { className: "border-r w-20" },
              schedule: { className: "min-w-24 max-w-56" },
              instructions: { className: "min-w-28 max-w-56" },
            }}
            headerClassName="text-gray-700 text-left font-normal bg-gray-50 text-xs print:text-[11px] first:rounded-none border-t"
            tableClassName="border-0 rounded-none"
          />
        )}
      </div>

      {/* Doctor's Signature */}

      <div className="text-right mt-20 mb-2">
        <p className="text-sm print:text-xs font-medium text-gray-950">
          {formatName(prescription.prescribed_by)}
        </p>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, isStrong = false }: DetailRowProps) => {
  return (
    <div className="flex gap-1">
      <span className="text-gray-700 font-medium min-w-24 shrink-0 text-sm print:text-xs">
        {label}
      </span>
      <span className="text-gray-700 text-sm print:text-xs">:</span>
      <span
        className={cn(
          "ml-1 text-sm print:text-xs",
          isStrong ? "font-semibold text-gray-950" : "text-gray-700",
        )}
      >
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
      disabled={!hasMedications}
      facility={facility}
      templateSlug={PrintTemplateType.prescription}
      footer={
        <div className="mt-2 text-xs print:text-[10px] text-gray-900 text-center flex gap-2 justify-center">
          <span>{t("computer_generated_prescription")}</span>|
          <span>{format(new Date(), "PP 'at' p")}</span>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto">
        <div>
          {/* Patient Details */}
          <div className="flex gap-4 pb-2 mb-2">
            <div className="flex flex-col flex-1 justify-between gap-3">
              <div className="flex gap-4">
                {/* Left column: Patient, Age/Sex, Mobile */}
                <div className="space-y-1 flex-3">
                  <DetailRow
                    label={t("patient")}
                    value={patient.name}
                    isStrong
                  />
                  <DetailRow
                    label={`${t("age")} / ${t("sex")}`}
                    value={
                      patient
                        ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                        : undefined
                    }
                    isStrong
                  />
                  <DetailRow
                    label={t("mobile_number")}
                    value={
                      patient && formatPhoneNumberIntl(patient.phone_number)
                    }
                    isStrong
                  />
                </div>

                {/* Right column: Identifiers + Encounter Date */}
                <div className="space-y-1 flex-2">
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
                  {prescriptions.length === 1 && (
                    <DetailRow
                      label={t("encounter_date")}
                      value={displayDate}
                      isStrong
                    />
                  )}
                </div>
              </div>

              {prescriptions.length === 1 &&
                prescriptions[0].encounter.current_location && (
                  <DetailRow
                    label={t("patient_ip_location")}
                    value={getLocationPath(
                      prescriptions[0].encounter.current_location,
                    )}
                  />
                )}
            </div>

            <div className="shrink-0">
              <QRCodeSVG
                value={patient.id}
                size={85}
                level="Q"
                marginSize={0}
              />
            </div>
          </div>

          {prescriptions.length > 1 && (
            <div className="mb-4 text-sm print:text-xs text-gray-500 border-b pb-2">
              {t("prescriptions_count", { count: prescriptions.length })}
            </div>
          )}

          {prescriptions.map((prescription, index) => (
            <div key={prescription.id}>
              {index > 0 && (
                <div className="border-t border-dashed border-gray-300 my-6" />
              )}
              <PrescriptionContent
                prescription={prescription}
                prescriptionIndex={index}
                totalCount={prescriptions.length}
              />
            </div>
          ))}
        </div>
      </div>
    </PrintPreview>
  );
};
