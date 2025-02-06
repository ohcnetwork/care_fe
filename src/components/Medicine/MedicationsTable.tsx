import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { reverseFrequencyOption } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";

import {
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest";

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
  medications: MedicationRequestRead[];
}

export const MedicationsTable = ({ medications }: MedicationsTableProps) => {
  const { t } = useTranslation();

  if (!medications?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500">
        {t("no_medications_found_for_this_encounter")}
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
          {medications.map((medication) => {
            const instruction = medication.dosage_instruction[0];
            const frequency = getFrequencyDisplay(instruction?.timing);
            const dosage = formatDosage(instruction);
            const duration = instruction?.timing?.repeat?.bounds_duration;
            const remarks = formatSig(instruction);
            const notes = medication.note;
            return (
              <TableRow key={medication.id} className="divide-x font-medium">
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
