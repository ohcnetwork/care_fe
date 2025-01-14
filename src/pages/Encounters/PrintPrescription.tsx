import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Separator } from "@/components/ui/separator";
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
import {
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequest,
} from "@/types/emr/medicationRequest";

function getFrequencyDisplay(
  timing?: MedicationRequest["dosage_instruction"][0]["timing"],
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
function formatDosage(instruction: MedicationRequest["dosage_instruction"][0]) {
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
function formatSig(instruction: MedicationRequest["dosage_instruction"][0]) {
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
      <div className="mx-auto max-w-4xl space-y-4 p-4">
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

        {/* Prescription Table */}
        <div className="w-full">
          <h2 className="text-center text-xl font-semibold text-[#046C4E] mb-4">
            PRESCRIPTION
          </h2>
          <Table className="border border-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12 text-center text-[#046C4E] font-medium">
                  #
                </TableHead>
                <TableHead className="w-[15%] text-[#046C4E] font-medium">
                  Medicine
                </TableHead>
                <TableHead className="w-[10%] text-[#046C4E] font-medium">
                  Dose
                </TableHead>
                <TableHead className="text-[#046C4E] font-medium">
                  Frequency
                </TableHead>
                <TableHead className="text-[#046C4E] font-medium">
                  Duration
                </TableHead>
                <TableHead className="w-1/3 text-[#046C4E] font-medium">
                  Remarks
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalMedications?.map((medication, index) => {
                const instruction = medication.dosage_instruction[0];
                const frequency = getFrequencyDisplay(instruction?.timing);
                const dosage = formatDosage(instruction);
                const duration = instruction?.timing?.repeat?.bounds_duration;
                const remarks = formatSig(instruction);

                return (
                  <TableRow key={medication.id} className="bg-white">
                    <TableCell className="text-center border-t">
                      {index + 1}
                    </TableCell>
                    <TableCell className="border-t">
                      <div className="font-medium">
                        {medication.medication?.display}
                      </div>
                    </TableCell>
                    <TableCell className="border-t">{dosage}</TableCell>
                    <TableCell className="border-t">
                      {frequency?.meaning}
                      {instruction?.additional_instruction?.[0]?.display && (
                        <div className="text-sm text-gray-600">
                          {instruction.additional_instruction[0].display}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="border-t">
                      {duration ? `${duration.value} ${duration.unit}` : "-"}
                    </TableCell>
                    <TableCell className="border-t text-gray-600">
                      {remarks || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* PRN Medications */}
              {prnMedications?.map((medication, index) => {
                const instruction = medication.dosage_instruction[0];
                const dosage = formatDosage(instruction);
                const remarks =
                  instruction?.as_needed_for?.display || "As needed (PRN)";

                return (
                  <TableRow key={medication.id} className="bg-white">
                    <TableCell className="text-center border-t">
                      {(normalMedications?.length || 0) + index + 1}
                    </TableCell>
                    <TableCell className="border-t">
                      <div className="font-medium">
                        {medication.medication?.display}
                      </div>
                    </TableCell>
                    <TableCell className="border-t">{dosage}</TableCell>
                    <TableCell className="border-t">
                      {t("as_needed_prn")}
                    </TableCell>
                    <TableCell className="border-t"></TableCell>
                    <TableCell className="border-t text-gray-600">
                      {remarks}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
