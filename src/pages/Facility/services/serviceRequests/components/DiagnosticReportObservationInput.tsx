import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import { QuestionType } from "@/types/emr/observationDefinition/observationDefinition";

interface DiagnosticReportObservationInputProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  dataType: QuestionType;
  disabled: boolean;
  onValueChange: (value: string) => void;
}

export function DiagnosticReportObservationInput({
  id,
  label,
  value,
  unit,
  dataType,
  disabled,
  onValueChange,
}: DiagnosticReportObservationInputProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex h-10 min-w-0 flex-1 cursor-text items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 shadow-xs transition-colors focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Input
        id={id}
        aria-label={label}
        aria-describedby={unit ? `${id}-unit` : undefined}
        className="field-sizing-content h-auto w-auto min-w-0 max-w-full border-none bg-transparent p-0 text-base shadow-none focus:ring-0 focus-visible:ring-0 disabled:cursor-default disabled:opacity-100 md:text-sm"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        type={
          dataType === "decimal" || dataType === "integer" ? "number" : "text"
        }
        disabled={disabled}
      />
      {unit && (
        <span
          id={`${id}-unit`}
          className="shrink-0 text-sm text-gray-500 select-none"
        >
          {unit}
        </span>
      )}
    </label>
  );
}
