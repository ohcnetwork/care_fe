import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { reverseFrequencyOption } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";

import query from "@/Utils/request/query";
import {
  INACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestDosageInstruction,
} from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { formatDosage, formatSig } from "./utils";

export function getFrequencyDisplay(
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

interface MedicationsTableProps {
  patientId: string;
  encounterId: string;
}

export const MedicationsTable = ({
  patientId,
  encounterId,
}: MedicationsTableProps) => {
  const { t } = useTranslation();

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medication_requests", patientId, encounterId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, limit: 50, offset: 0 },
    }),
  });
  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500">
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
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
          {medications?.results.map((medication) => {
            const instruction = medication.dosage_instruction[0];
            const frequency = getFrequencyDisplay(instruction?.timing);
            const dosage = formatDosage(instruction);
            const duration = instruction?.timing?.repeat?.bounds_duration;
            const remarks = formatSig(instruction);
            const notes = medication.note;
            const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
              medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
            );

            return (
              <TableRow
                key={medication.id}
                className={`divide-x font-medium ${isInactive ? "bg-gray-100" : ""}`}
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
                  {notes ? ` (${t("note")}: ${notes})` : ""}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
