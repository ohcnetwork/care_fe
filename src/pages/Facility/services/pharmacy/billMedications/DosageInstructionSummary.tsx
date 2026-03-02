import {
  formatDosage,
  formatDuration,
  formatFrequencyShort,
  formatTotalUnits,
} from "@/components/Medicine/utils";
import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";
import { useTranslation } from "react-i18next";

export default function DosageInstructionSummaryLine({
  dosageInstruction,
}: {
  dosageInstruction?: MedicationRequestDosageInstruction;
}) {
  const { t } = useTranslation();

  return (
    <>
      {formatDosage(dosageInstruction)}
      {" × "}({formatFrequencyShort(dosageInstruction)}){" × "}
      {formatDuration(dosageInstruction, { abbreviated: true }) || "-"}
      {" = "}
      {formatTotalUnits(
        dosageInstruction ? [dosageInstruction] : [],
        t("units"),
      )}
    </>
  );
}
