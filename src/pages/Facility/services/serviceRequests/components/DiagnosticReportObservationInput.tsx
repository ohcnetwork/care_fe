import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Code } from "@/types/base/code/code";
import { QuestionType } from "@/types/emr/observationDefinition/observationDefinition";

interface DiagnosticReportObservationInputProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  permittedUnit?: Code | null;
  dataType: QuestionType;
  placeholder: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
}

export function DiagnosticReportObservationInput({
  id,
  label,
  value,
  unit,
  permittedUnit,
  dataType,
  placeholder,
  disabled,
  onValueChange,
  onUnitChange,
}: DiagnosticReportObservationInputProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 flex-1 items-stretch">
      <Input
        id={id}
        aria-label={label}
        aria-describedby={permittedUnit ? `${id}-unit` : undefined}
        className={cn(
          "h-10 min-w-0 shadow-none focus:relative focus:z-10",
          permittedUnit && "rounded-r-none",
        )}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        type={
          dataType === "decimal" || dataType === "integer" ? "number" : "text"
        }
        disabled={disabled}
      />
      {permittedUnit && (
        <Select value={unit} onValueChange={onUnitChange} disabled={disabled}>
          <SelectTrigger
            id={`${id}-unit`}
            aria-label={`${label} ${t("unit")}`}
            className="-ml-px w-24! max-w-[45%] shrink-0 rounded-l-none bg-gray-50 shadow-none data-[size=default]:h-10 focus-visible:relative focus-visible:z-10"
          >
            <SelectValue placeholder={t("unit")}>
              {unit || undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={permittedUnit.code}>
              {permittedUnit.code || permittedUnit.display}
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
