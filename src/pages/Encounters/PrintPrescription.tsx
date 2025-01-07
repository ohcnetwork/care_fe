import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";
import { MedicationRequest } from "@/types/emr/medicationRequest";

const FREQUENCY_DISPLAY: Record<string, { code: string; meaning: string }> = {
  "1-1-d": { code: "OD", meaning: "Once daily" },
  "2-1-d": { code: "BD", meaning: "Twice daily" },
  "1-1-wk": { code: "QWK", meaning: "Once a week" },
  "4-1-h": { code: "Q4H", meaning: "Every 4 hours" },
  "6-1-h": { code: "QID", meaning: "Four times a day" },
  "8-1-h": { code: "TID", meaning: "Three times a day" },
  "1-1-s": { code: "STAT", meaning: "Immediately" },
  "1-1-d-night": { code: "HS", meaning: "At bedtime" },
  "2-1-d-alt": { code: "QOD", meaning: "Every other day" },
};

function getFrequencyDisplay(
  timing?: MedicationRequest["dosage_instruction"][0]["timing"],
) {
  if (!timing?.repeat) return undefined;
  const key = `${timing.repeat.frequency}-${timing.repeat.period}-${timing.repeat.period_unit}`;
  return FREQUENCY_DISPLAY[key];
}

// Helper function to format dosage in Rx style
function formatDosage(instruction: MedicationRequest["dosage_instruction"][0]) {
  if (!instruction.dose_and_rate) return "";

  if (instruction.dose_and_rate.type === "calculated") {
    const { dose_range } = instruction.dose_and_rate;
    if (!dose_range) return "";
    return `${dose_range.low.value}${dose_range.low.unit} - ${dose_range.high.value}${dose_range.high.unit}`;
  }

  const { dose_quantity } = instruction.dose_and_rate;
  if (!dose_quantity?.value) return "";

  return `${dose_quantity.value} ${dose_quantity.unit || ""}`.trim();
}

// Helper function to format dosage instructions in Rx style
function formatSig(
  instruction: MedicationRequest["dosage_instruction"][0],
  frequency?: { code: string; meaning: string },
) {
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

  // Add frequency
  if (frequency) {
    parts.push(frequency.code);
  } else if (instruction.timing?.repeat) {
    const { frequency, period_unit } = instruction.timing.repeat;
    if (frequency) {
      parts.push(`${frequency} time(s) per ${period_unit}`);
    }
  }

  return parts.join(" ");
}

export const PrintPrescription = (props: {
  facilityId: string;
  encounterId: string;
}) => {
  const { facilityId, encounterId } = props;
  const { t } = useTranslation();

  const { data: encounter } = useQuery({
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
      queryParams: { encounter: encounterId },
    }),
    enabled: !!encounter?.patient?.id,
  });

  const normalMedications = medications?.results?.filter(
    (m) => !m.dosage_instruction[0]?.as_needed_boolean,
  );
  const prnMedications = medications?.results?.filter(
    (m) => m.dosage_instruction[0]?.as_needed_boolean,
  );

  // Collect all unique frequencies used in the prescription
  const usedFrequencies = new Set<string>();
  medications?.results?.forEach((med) => {
    const timing = med.dosage_instruction[0]?.timing;
    if (!timing?.repeat) return;
    const key = `${timing.repeat.frequency}-${timing.repeat.period}-${timing.repeat.period_unit}`;
    if (FREQUENCY_DISPLAY[key]) {
      usedFrequencies.add(key);
    }
  });

  if (!medications?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-muted-foreground">
        No medications found for this encounter.
      </div>
    );
  }

  return (
    <PrintPreview
      title={
        encounter?.patient
          ? `Prescriptions - ${encounter.patient.name}`
          : "Print Prescriptions"
      }
      disabled={!(encounter?.patient && medications)}
    >
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-2">
          <div>
            <h2 className="text-xl font-bold">{encounter?.facility?.name}</h2>
          </div>
          <img
            className="h-8 w-auto"
            src={careConfig.mainLogo?.dark}
            alt="care logo"
          />
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-2 text-sm">
          <div className="space-y-1">
            <PatientDetail name="Patient">
              {encounter?.patient && (
                <>
                  <span className="uppercase">{encounter.patient.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({t(`GENDER__${encounter.patient.gender}`)},{" "}
                    {formatPatientAge(encounter.patient, true)})
                  </span>
                </>
              )}
            </PatientDetail>
            <PatientDetail name="Encounter Date">
              {encounter?.period?.start &&
                format(new Date(encounter.period.start), "PPP")}
            </PatientDetail>
          </div>
          {encounter?.external_identifier && (
            <div>
              <PatientDetail name="IP/OP No.">
                {encounter.external_identifier}
              </PatientDetail>
            </div>
          )}
        </div>

        {/* Frequency Legend */}
        {usedFrequencies.size > 0 && (
          <div className="rounded-lg border border-dashed p-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Frequency Guide:
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              {Array.from(usedFrequencies).map((key) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-medium">
                    {FREQUENCY_DISPLAY[key].code}
                  </Badge>
                  <span className="text-muted-foreground">
                    = {FREQUENCY_DISPLAY[key].meaning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rx Symbol and Medications */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif">℞</span>
            <Separator className="flex-1" />
          </div>

          {/* Normal Medications */}
          {normalMedications && normalMedications.length > 0 && (
            <div className="space-y-2">
              {normalMedications.map((medication, index) => (
                <PrescriptionEntry
                  key={medication.id}
                  medication={medication}
                  index={index + 1}
                />
              ))}
            </div>
          )}

          {/* PRN Medications */}
          {prnMedications && prnMedications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">
                  Take When Required (PRN)
                </h3>
                <Separator className="flex-1" />
              </div>
              {prnMedications.map((medication, index) => (
                <PrescriptionEntry
                  key={medication.id}
                  medication={medication}
                  index={index + 1}
                  prn
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-center">
              <Separator className="mt-6" />

              <p className="text-xs text-muted-foreground">
                Sign of the Consulting Doctor
              </p>
            </div>
          </div>

          <div className="space-y-1 pt-2 text-center text-[10px] text-muted-foreground">
            <p>Generated on: {format(new Date(), "PPP 'at' p")}</p>
            <p>
              This is a computer generated prescription. It shall be issued to
              the patient only after the concerned doctor has verified the
              content and authorized the same by affixing signature.
            </p>
          </div>
        </div>
      </div>
    </PrintPreview>
  );
};

const PatientDetail = ({
  name,
  children,
}: {
  name: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{name}</p>
      {children != null ? (
        <p className="font-medium">{children}</p>
      ) : (
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
      )}
    </div>
  );
};

const PrescriptionEntry = ({
  medication,
  index,
}: {
  medication: MedicationRequest;
  index: number;
  prn?: boolean;
}) => {
  const instruction = medication.dosage_instruction[0];

  if (!instruction) return null;

  const frequency = getFrequencyDisplay(instruction.timing);
  const dosage = formatDosage(instruction);
  const sig = formatSig(instruction, frequency);

  const hasAdditionalInstructions =
    (instruction.additional_instruction &&
      instruction.additional_instruction.length > 0) ||
    medication.note;

  return (
    <div className="relative rounded border px-3 py-2 text-sm">
      <div className="absolute -left-4 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
        {index}
      </div>

      {/* Medicine Name and Status */}
      <div className="ml-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-smuppercase">
              {medication.medication?.display}
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {medication.medication?.code} ({medication.medication?.system})
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant={medication.status === "active" ? "outline" : "secondary"}
            >
              {medication.status}
            </Badge>
          </div>
        </div>

        {/* Dosage and Instructions */}
        <div className="flex flex-col gap-1 rounded-md bg-gray-50 px-2 py-1">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-medium">Dosage:</span>
            <span>{dosage}</span>
          </div>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-medium">Instructions:</span>
            <span>{sig}</span>
          </div>
          {instruction.as_needed_boolean && (
            <div className="flex items-baseline gap-2 text-sm">
              <span className="font-medium">Take when:</span>
              <span>
                {instruction.as_needed_for?.display || "As needed (PRN)"}
              </span>
            </div>
          )}
        </div>

        {/* Additional Instructions */}
        {hasAdditionalInstructions && (
          <div className="space-y-1 text-xs">
            {instruction.additional_instruction?.map((instr, idx) => (
              <div
                key={idx}
                className="flex items-baseline gap-2 text-muted-foreground"
              >
                <span>{instr.display}</span>
              </div>
            ))}
            {medication.note && (
              <div className="flex items-baseline gap-2 text-muted-foreground">
                <span>•</span>
                <span>{medication.note}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
