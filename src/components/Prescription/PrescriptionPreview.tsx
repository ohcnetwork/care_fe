import careConfig from "@careConfig";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import PrintTable from "@/components/Common/PrintTable";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage, formatSig } from "@/components/Medicine/utils";

import { formatName, formatPatientAge } from "@/Utils/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Encounter } from "@/types/emr/encounter/encounter";
import {
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import { Patient } from "@/types/emr/patient/patient";

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

interface PrescriptionPreviewProps {
  encounter?: Encounter;
  medications: MedicationRequestRead[];
  patient: Patient;
}

export const PrescriptionPreview = ({
  encounter,
  medications,
  patient,
}: PrescriptionPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const medicationsWithProduct = medications.filter(
    (med) => med.requested_product,
  );

  const medicationsWithoutProduct = medications.filter(
    (med) => !med.requested_product,
  );

  // Group medications by prescriber
  const medicationsByPrescriber = medications.reduce<
    Record<string, MedicationRequestRead[]>
  >((acc, med) => {
    const prescriberId = med.created_by.id.toString();
    if (!acc[prescriberId]) {
      acc[prescriberId] = [];
    }
    acc[prescriberId].push(med);
    return acc;
  }, {});

  if (!medications?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={`${t("prescriptions")} - ${patient.name}`}
      disabled={!medications?.length}
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
              {facility?.address && (
                <div className="text-gray-500 whitespace-pre-wrap break-words text-sm">
                  {facility.address}
                  {facility.phone_number && (
                    <p className="text-gray-500 text-sm">
                      {facility.phone_number}
                    </p>
                  )}
                </div>
              )}
              <h2 className="mt-2 text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("medicine_prescription")}
              </h2>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-3">
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
            </div>
            <div className="space-y-3">
              <DetailRow
                label={t("date")}
                value={
                  encounter?.period?.start
                    ? format(
                        new Date(encounter.period.start),
                        "dd MMM yyyy, EEEE",
                      )
                    : format(new Date(), "dd MMM yyyy, EEEE")
                }
                isStrong
              />
              <DetailRow
                label={t("mobile_number")}
                value={patient && formatPhoneNumberIntl(patient.phone_number)}
                isStrong
              />
            </div>
          </div>

          {/* Prescription Symbol */}
          <div className="text-2xl font-semibold mb-3">℞</div>

          {/* Medications Table */}
          {medicationsWithProduct && medicationsWithProduct.length > 0 && (
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
                rows={medicationsWithProduct?.map((medication) => {
                  const instruction = medication.dosage_instruction[0];
                  const frequency = getFrequencyDisplay(instruction?.timing);
                  const dosage = formatDosage(instruction);
                  const duration = instruction?.timing?.repeat?.bounds_duration;
                  const remarks = formatSig(instruction);
                  const notes = medication.note;
                  return {
                    medicine: displayMedicationName(medication),
                    status: t(`medication_status_${medication.status}`),
                    dosage: dosage,
                    frequency: instruction?.as_needed_boolean
                      ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display ?? "-"})`
                      : (frequency?.meaning ?? "-") +
                        (instruction?.additional_instruction?.[0]?.display
                          ? `, ${instruction.additional_instruction[0].display}`
                          : ""),
                    duration: duration
                      ? `${duration.value} ${duration.unit}`
                      : "-",
                    instructions: `${remarks || "-"}${notes ? ` (${t("note")}: ${notes})` : ""}`,
                  };
                })}
              />
            </div>
          )}

          {/* External Medications Table */}
          {medicationsWithoutProduct &&
            medicationsWithoutProduct.length > 0 && (
              <div className="mt-4">
                <p className="text-base font-semibold mb-2">+</p>
                <PrintTable
                  headers={[
                    { key: "medicine" },
                    { key: "dosage" },
                    { key: "frequency" },
                    { key: "duration" },
                    { key: "instructions" },
                  ]}
                  rows={medicationsWithoutProduct?.map((medication) => {
                    const instruction = medication.dosage_instruction[0];
                    const frequency = getFrequencyDisplay(instruction?.timing);
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
                        ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display ?? "-"})`
                        : (frequency?.meaning ?? "-") +
                          (instruction?.additional_instruction?.[0]?.display
                            ? `, ${instruction.additional_instruction[0].display}`
                            : ""),
                      duration: duration
                        ? `${duration.value} ${duration.unit}`
                        : "-",
                      instructions: `${remarks || "-"}${notes ? ` (${t("note")}: ${notes})` : ""}`,
                    };
                  })}
                />
              </div>
            )}

          {/* Doctor's Signature */}
          <div className="w-full items-end mt-6 flex flex-col justify-end gap-1">
            <p className="text-sm text-gray-400">{t("prescribed_by")}</p>
            {Object.entries(medicationsByPrescriber).map(
              ([prescriberId, meds]) => {
                const prescriber = meds[0].created_by;
                return (
                  <div key={prescriberId} className="text-center ">
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
