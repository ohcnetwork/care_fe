import { cn } from "@/lib/utils";

import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";

interface DosageInstructionListProps {
  instructions: MedicationRequestDosageInstruction[];
  renderItem: (
    instruction: MedicationRequestDosageInstruction,
    index: number,
  ) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  gap?: "sm" | "md";
}

/**
 * Renders a divided list of dosage instructions with dashed separators.
 * Used in table cells to display multi-step dosage regimens.
 *
 * @example
 * <DosageInstructionList
 *   instructions={medication.dosage_instruction}
 *   renderItem={(di) => formatDosage(di) || "-"}
 * />
 */
export function DosageInstructionList({
  instructions,
  renderItem,
  className,
  itemClassName,
  gap = "md",
}: DosageInstructionListProps) {
  const pt = gap === "sm" ? "pt-1" : "pt-1.5";
  const pb = gap === "sm" ? "pb-1" : "pb-1.5";

  return (
    <div className={cn("divide-y divide-dashed divide-gray-300", className)}>
      {instructions.map((di, idx) => (
        <div
          key={idx}
          className={cn(
            itemClassName,
            idx > 0 && pt,
            idx < instructions.length - 1 && pb,
          )}
        >
          {renderItem(di, idx)}
        </div>
      ))}
    </div>
  );
}
