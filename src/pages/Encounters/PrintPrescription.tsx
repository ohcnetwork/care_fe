import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { reverseFrequencyOption } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import {
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest";

function getFrequencyDisplay(
  timing?: MedicationRequestDosageInstruction["timing"],
) {
  if (!timing) return undefined;
  const code = reverseFrequencyOption(timing);
  if (!code) return undefined;
  return {
    code,
    meaning: MEDICATION_REQUEST_TIMING_OPTIONS[code].display,
  };
}

// Helper function to format dosage in Rx style
function formatDosage(instruction: MedicationRequestDosageInstruction) {
  if (!instruction.dose_and_rate) return "";

  if (instruction.dose_and_rate.type === "calculated") {
    const { dose_range } = instruction.dose_and_rate;
    if (!dose_range) return "";
    return `${dose_range.low.value}${dose_range.low.unit.display} - ${dose_range.high.value}${dose_range.high.unit.display}`;
  }

  const { dose_quantity } = instruction.dose_and_rate;
  if (!dose_quantity?.value || !dose_quantity.unit) return "";

  return `${dose_quantity.value} ${dose_quantity.unit.display}`;
}

// Helper function to format dosage instructions in Rx style
function formatSig(instruction: MedicationRequestDosageInstruction) {
  const parts: string[] = [];

  // Add route if present
  if (instruction.route?.display) {
    parts.push(`Via ${instruction.route.display}`);
  }

  // Add method if present
  if (instruction.method?.display) {
    parts.push(`by ${instruction.method.display}`);
  }

  // Add site if present
  if (instruction.site?.display) {
    parts.push(`to ${instruction.site.display}`);
  }

  return parts.join(" ");
}

export const PrintPrescription = (props: {
  facilityId: string;
  encounterId: string;
}) => {
  const { facilityId, encounterId } = props;
  const { t } = useTranslation();

  const { data: encounter } = useQuery<Encounter>({
    queryKey: ["encounter", encounterId],
    queryFn: query(api.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  const { data: medications } = useQuery({
    queryKey: ["medications", encounter?.patient?.id],
    queryFn: query(api.medicationRequest.list, {
      pathParams: { patientId: encounter?.patient?.id || "" },
      queryParams: { encounter: encounterId, limit: 50, offset: 0 },
    }),
    enabled: !!encounter?.patient?.id,
  });

  if (!medications?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-muted-foreground">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  // Group medications by prescriber
  const medicationsByPrescriber = medications.results.reduce<
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
      title={
        encounter?.patient
          ? `${t("prescriptions")} - ${encounter.patient.name}`
          : t("print_prescriptions")
      }
      disabled={!(encounter?.patient && medications)}
    >
      <div className="min-h-screen bg-white p-2 max-w-4xl mx-auto">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pb-2 border-b">
            <div>
              <h1 className="text-3xl font-semibold">
                {encounter?.facility?.name}
              </h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("medicine_prescription")}
              </h2>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-3">
              <DetailRow
                label={t("patient")}
                value={encounter?.patient?.name}
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
                value={encounter?.patient?.phone_number}
                isStrong
              />
            </div>
          </div>

          {/* Prescription Symbol */}
          <div className="text-2xl font-semibold mb-3">℞</div>

          {/* Medications Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table className="">
              <TableHeader>
                <TableRow className="divide-x bg-gray-100">
                  <TableHead>{t("medicine")}</TableHead>
                  <TableHead>{t("dosage")}</TableHead>
                  <TableHead>{t("frequency")}</TableHead>
                  <TableHead>{t("duration")}</TableHead>
                  <TableHead>{t("instructions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.results.map((medication) => {
                  const instruction = medication.dosage_instruction[0];
                  const frequency = getFrequencyDisplay(instruction?.timing);
                  const dosage = formatDosage(instruction);
                  const duration = instruction?.timing?.repeat?.bounds_duration;
                  const remarks = formatSig(instruction);

                  return (
                    <TableRow
                      key={medication.id}
                      className="divide-x font-medium"
                    >
                      <TableCell className="py-2 px-3">
                        {medication.medication?.display}
                      </TableCell>
                      <TableCell className="py-2 px-3">{dosage}</TableCell>
                      <TableCell className="py-2 px-3">
                        {instruction?.as_needed_boolean
                          ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display})`
                          : frequency?.meaning}
                        {instruction?.additional_instruction?.[0]?.display && (
                          <div className="text-sm text-gray-600">
                            {instruction.additional_instruction[0].display}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {duration ? `${duration.value} ${duration.unit}` : "-"}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {remarks || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Doctor's Signature */}
          <div className="mt-6 flex justify-end gap-8">
            {Object.entries(medicationsByPrescriber).map(
              ([prescriberId, meds]) => {
                const prescriber = meds[0].created_by;
                return (
                  <div key={prescriberId} className="text-center">
                    <p className="text-sm text-gray-600 font-semibold">
                      Dr. {prescriber.first_name} {prescriber.last_name}
                    </p>
                  </div>
                );
              },
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-1 pt-2 text-[10px] text-muted-foreground flex justify-between">
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
