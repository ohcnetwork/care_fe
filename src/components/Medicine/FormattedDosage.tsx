import { cn } from "@/lib/utils";

import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";

import { formatDosage, isNonUnitDose } from "./utils";

interface FormattedDosageProps {
  instruction?: MedicationRequestDosageInstruction;
  /**
   * Highlight dosages that are dose ranges or whose value is not a single unit
   */
  highlight?: boolean;
  className?: string;
  fallback?: string;
}

/**
 * Renders a formatted dosage string and, by default, visually highlights
 * non-unit dosages (dose ranges and quantities ≠ 1)
 */
export function FormattedDosage({
  instruction,
  highlight = true,
  className,
  fallback = "",
}: FormattedDosageProps) {
  const text = formatDosage(instruction);
  if (!text) return <>{fallback}</>;

  if (highlight && isNonUnitDose(instruction)) {
    return (
      <span
        className={cn(
          "rounded bg-yellow-100 px-1.5 py-0.5 font-semibold text-yellow-900",
          className,
        )}
      >
        {text}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}
