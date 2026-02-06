import { useQueries, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import PrintTable from "@/components/Common/PrintTable";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage, formatSig } from "@/components/Medicine/utils";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";
import { Markdown } from "@/components/ui/markdown";

import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import {
  PatientIdentifier,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import careConfig from "@careConfig";
import { QRCodeSVG } from "qrcode.react";

interface PrintPrescriptionProps {
  facilityId: string;
  patientId: string;
  prescriptionId?: string;
}

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

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

export const PrintAllPrescriptions = ({
  facilityId,
  patientId,
}: {
  facilityId: string;
  patientId: string;
}) => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    isSelectedEncounterLoading: encounterLoading,
  } = useEncounter();
  const encounterId = encounter?.id;

  const {
    data: prescriptionList,
    isLoading: listLoading,
    isError: listError,
  } = useQuery({
    queryKey: ["prescription_list", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!encounterId,
  });

  const prescriptionQueries = useQueries({
    queries: (prescriptionList?.results || []).map((pres) => ({
      queryKey: ["prescription", patientId, pres.id],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: pres.id! },
        queryParams: { facility: facilityId },
      }),
    })),
  });

  const allPrescriptionsLoading = prescriptionQueries.some((q) => q.isLoading);
  const allPrescriptionsError = prescriptionQueries.some((q) => q.isError);

  const prescriptions = prescriptionQueries
    .map((q) => q.data)
    .filter((p): p is PrescriptionRead => !!p);

  if (encounterLoading || listLoading || allPrescriptionsLoading) {
    return <Loading />;
  }

  if (listError || allPrescriptionsError) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-red-200 p-4 text-red-500">
        {t("prescription_load_failed")}
      </div>
    );
  }

  if (!encounter) {
    return <Loading />;
  }

  if (prescriptions.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4 text-gray-500">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={`${t("prescriptions")} - ${encounter.patient.name}`}
      disabled={prescriptions.length === 0}
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex justify-between items-start border-b border-gray-200 pb-2">
          <div className="flex items-start gap-4">
            <div className="text-left">
              <h1 className="text-2xl font-medium">
                {encounter.facility?.name || ""}
              </h1>
              {(() => {
                const facility = encounter.facility as
                  | (typeof encounter.facility & { address?: string })
                  | null;
                const address = facility?.address;
                const phoneNumber = (
                  facility as
                    | (typeof facility & { phone_number?: string })
                    | null
                )?.phone_number;
                return address ? (
                  <div className="text-sm rounded-md whitespace-pre-wrap text-gray-500">
                    {address}
                    {phoneNumber && (
                      <p className="text-sm text-gray-500">
                        {t("phone")}: {phoneNumber}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          <QRCodeSVG
            value={encounter.patient.id}
            size={50}
            level="Q"
            marginSize={0}
          />
          <img
            src={careConfig.mainLogo?.dark}
            alt="Logo"
            className="mb-2 h-10 w-auto object-contain sm:mb-0 text-end"
          />
        </div>

        {/* Patient Details */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="space-y-1">
            <DetailRow
              label={t("patient")}
              value={encounter.patient.name}
              isStrong
            />
            <DetailRow
              label={`${t("age")} / ${t("sex")}`}
              value={
                encounter.patient
                  ? `${formatPatientAge(encounter.patient, true)}, ${t(
                      `GENDER__${encounter.patient.gender}`,
                    )}`
                  : undefined
              }
              isStrong
            />
            {encounter.patient.instance_identifiers
              ?.filter(
                ({ config }: PatientIdentifier) =>
                  config.config.use === PatientIdentifierUse.official,
              )
              .map((identifier: PatientIdentifier) => (
                <DetailRow
                  key={identifier.config.id}
                  label={identifier.config.config.display}
                  value={identifier.value}
                  isStrong
                />
              ))}
          </div>
          <div className="space-y-1">
            <DetailRow
              label={t("date")}
              value={format(new Date(), "dd MMM yyyy, EEEE")}
              isStrong
            />
            <DetailRow
              label={t("mobile_number")}
              value={
                encounter.patient &&
                formatPhoneNumberIntl(encounter.patient.phone_number)
              }
              isStrong
            />
          </div>
        </div>

        {/* Prescriptions */}
        <div className="flex flex-col mt-8">
          {prescriptions.map((prescriptionData) => (
            <div key={prescriptionData.id}>
              {/* Prescription Symbol */}
              <div className="text-xl font-semibold mb-3 flex items-end gap-4">
                <p>{t("℞")}</p>
                <p className="text-sm text-gray-600 font-semibold ">
                  {formatDateTime(
                    prescriptionData.created_date,
                    "DD/MM/YYYY hh:mm A",
                  )}
                </p>
              </div>

              {/* Medications Table */}
              {prescriptionData.medications &&
                prescriptionData.medications.length > 0 && (
                  <div className="mt-4">
                    <p className="text-base font-semibold mb-2">
                      {t("medicines")}
                    </p>
                    <PrintTable
                      headers={[
                        { key: "medicine" },
                        { key: "dosage" },
                        { key: "frequency" },
                        { key: "duration" },
                        { key: "instructions" },
                      ]}
                      rows={prescriptionData.medications?.map((medication) => {
                        const instruction = medication.dosage_instruction[0];
                        const frequency = getFrequencyDisplay(
                          instruction?.timing,
                        );
                        const dosage = formatDosage(instruction);
                        const duration =
                          instruction?.timing?.repeat?.bounds_duration;
                        const remarks = formatSig(instruction);
                        const notes = medication.note;
                        return {
                          medicine: displayMedicationName(medication),
                          status: t(`medication_status_${medication.status}`),
                          dosage: dosage,
                          frequency: instruction?.as_needed_boolean
                            ? `${t("as_needed_prn")}`
                            : (frequency?.meaning ?? "-") +
                              (instruction?.additional_instruction?.[0]?.display
                                ? `, ${instruction.additional_instruction[0].display}`
                                : ""),
                          duration: duration
                            ? `${duration.value} ${duration.unit}`
                            : "-",
                          instructions: [remarks, notes]
                            .filter(Boolean)
                            .join("\n"),
                        };
                      })}
                      className="text-xs font-semibold whitespace-break-spaces text-gray-950"
                      cellConfig={{
                        medicine: { className: "text-left" },
                      }}
                    />
                  </div>
                )}
              {prescriptionData?.note && (
                <div className="mt-6 mb-6 text-sm text-gray-600">
                  <p className="font-semibold mb-1">{t("note")}</p>
                  <Markdown
                    content={prescriptionData.note}
                    prose={false}
                    className="text-sm"
                  />
                </div>
              )}
              {/* Doctor's Signature */}
              <div className="w-full items-end mt-6 flex flex-row justify-end gap-1">
                <div className="text-right">
                  <p className="text-xs text-gray-400">{t("prescribed_by")}</p>
                  <p className="text-sm text-gray-600 font-semibold">
                    {formatName(prescriptionData.prescribed_by)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <PrintFooter leftContent={t("computer_generated_prescription")} />
      </div>
    </PrintPreview>
  );
};

export const PrintPrescription = ({
  facilityId,
  patientId,
  prescriptionId,
}: PrintPrescriptionProps) => {
  const { t } = useTranslation();

  const { data: prescription, isLoading: prescriptionLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!prescriptionId,
  });

  if (prescriptionLoading) {
    return <Loading />;
  }

  if (!prescription) {
    return <div>{t("prescription_not_found")}</div>;
  }

  return <PrescriptionPreview prescription={prescription} />;
};
