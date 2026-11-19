import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

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
  const { t } = useTranslation();

  return (
    <InputGroup
      data-disabled={disabled || undefined}
      className={cn("min-w-0 flex-1 bg-background", disabled && "opacity-50")}
    >
      <InputGroupInput
        id={id}
        aria-label={label}
        aria-describedby={unit ? `${id}-unit` : undefined}
        className="min-w-0 disabled:opacity-100"
        placeholder={t("result_value")}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        type={
          dataType === "decimal" || dataType === "integer" ? "number" : "text"
        }
        disabled={disabled}
      />
      {unit && (
        <InputGroupAddon align="inline-end">
          <InputGroupText id={`${id}-unit`}>{unit}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
