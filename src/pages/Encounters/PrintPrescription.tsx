import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";
import PrintTable from "@/components/Common/PrintTable";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage, formatSig } from "@/components/Medicine/utils";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

export const PrintPrescription = (props: {
  facilityId: string;
  encounterId: string;
  patientId: string;
}) => {
  const { facilityId, encounterId, patientId } = props;
  const { t } = useTranslation();

  const { data: encounter } = useQuery<Encounter>({
    queryKey: ["encounter", encounterId],
    queryFn: query(api.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  const { data: activeMedications, isLoading: medicationLoading } = useQuery({
    queryKey: ["medication_requests_active", patientId],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounterId,
        status: ["active", "on-hold", "draft", "unknown"].join(","),
      },
      pageSize: 100,
    }),
    enabled: !!patientId,
  });

  if (medicationLoading) return <Loading />;

  if (!activeMedications?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  // Group medications by prescriber
  const medicationsByPrescriber = activeMedications.results.reduce<
    Record<string, MedicationRequestRead[]>
  >((acc, med) => {
    const prescriberId = med.created_by.id.toString();
    if (!acc[prescriberId]) {
      acc[prescriberId] = [];
    }
    acc[prescriberId].push(med);
    return acc;
  }, {});

  return (
    <PrintPreview
      title={`${t("prescriptions")} - ${encounter?.patient.name}`}
      disabled={!activeMedications?.results?.length}
    >
      <div className="min-h-screen md:p-2 max-w-4xl mx-auto">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">
                {encounter?.facility?.name}
              </h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("medicine_prescription")}
              </h2>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-3">
              <DetailRow
                label={t("patient")}
                value={encounter?.patient.name}
                isStrong
              />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  encounter?.patient
                    ? `${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`
                    : undefined
                }
                isStrong
              />
            </div>
            <div className="space-y-3">
              <DetailRow
                label={t("encounter_date")}
                value={
                  encounter?.period?.start &&
                  format(new Date(encounter.period.start), "dd MMM yyyy, EEEE")
                }
                isStrong
              />
              <DetailRow
                label={t("mobile_number")}
                value={
                  encounter &&
                  formatPhoneNumberIntl(encounter.patient.phone_number)
                }
                isStrong
              />
            </div>
          </div>

          {/* Prescription Symbol */}
          <div className="text-2xl font-semibold mb-3">℞</div>

          {/* Medications Table */}
          <PrintTable
            headers={[
              { key: "medicine" },
              { key: "dosage" },
              { key: "frequency" },
              { key: "duration" },
              { key: "instructions" },
            ]}
            rows={activeMedications?.results.map((medication) => {
              const instruction = medication.dosage_instruction[0];
              const frequency = getFrequencyDisplay(instruction?.timing);
              const additionalInstructions = instruction?.additional_instruction
                ?.map((item) => item.display)
                .filter(Boolean)
                .join(", ");
              const dosage = formatDosage(instruction);
              const duration = instruction?.timing?.repeat?.bounds_duration;
              const remarks = formatSig(instruction);
              const notes = medication.note;
              return {
                medicine: medication.medication?.display,
                status: t(`medication_status__${medication.status}`),
                dosage: dosage,
                frequency: instruction?.as_needed_boolean
                  ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display ?? "-"})` +
                    (instruction?.additional_instruction?.length
                      ? `, ${additionalInstructions}`
                      : "")
                  : `${frequency?.meaning ?? "-"}${
                      instruction?.additional_instruction?.length
                        ? `, ${additionalInstructions}`
                        : ""
                    }`,
                duration: duration ? `${duration.value} ${duration.unit}` : "-",
                instructions: `${remarks || "-"}${notes ? ` (${t("note")}: ${notes})` : ""}`,
              };
            })}
          />

          {/* Doctor's Signature */}
          <div className="mt-6 flex justify-end gap-8">
            {Object.entries(medicationsByPrescriber).map(
              ([prescriberId, meds]) => {
                const prescriber = meds[0].created_by;
                return (
                  <div key={prescriberId} className="text-center">
                    <p className="text-sm text-gray-600 font-semibold">
                      {formatName(prescriber)}
                    </p>
                  </div>
                );
              },
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-2 text-[10px] text-gray-500 flex justify-between flex-wrap">
            <p>
              {t("generated_on")} {format(new Date(), "PPP 'at' p")}
            </p>
            <p>{t("computer_generated_prescription")}</p>
          </div>
        </div>
      </div>
    </PrintPreview>
  );
};

const DetailRow = ({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}) => {
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
