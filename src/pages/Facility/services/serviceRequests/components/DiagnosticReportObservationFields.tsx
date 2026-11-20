import { Label } from "@/components/ui/label";
import { ObservationDefinitionEmbedded } from "@/types/emr/observationDefinition/observationDefinition";

import { DiagnosticReportObservationInput } from "./DiagnosticReportObservationInput";
import { ObservationValue } from "./diagnosticReportFormTypes";
import { DiagnosticReportDraft } from "./useDiagnosticReportDraft";

interface DiagnosticReportObservationFieldsProps {
  reportId: string;
  definition: ObservationDefinitionEmbedded;
  observation: ObservationValue;
  index: number;
  disabled: boolean;
  draft: DiagnosticReportDraft;
}

export function DiagnosticReportObservationFields({
  reportId,
  definition,
  observation,
  index,
  disabled,
  draft,
}: DiagnosticReportObservationFieldsProps) {
  const inputId = `observation-${reportId}-${definition.id}-${index}`;
  if (!definition.component?.length) {
    return (
      <DiagnosticReportObservationInput
        id={inputId}
        label={definition.title || definition.code.display}
        value={observation.value}
        unit={observation.unit}
        dataType={definition.permitted_data_type}
        disabled={disabled}
        onValueChange={(value) =>
          draft.handleValueChange(definition.id, index, value, observation.unit)
        }
      />
    );
  }
  return (
    <div className="min-w-0 flex-1 space-y-3">
      {definition.component.map((component, componentIndex) => {
        const data = observation.components[component.code.code] ?? {
          value: "",
          unit: component.permitted_unit?.code || "",
        };
        const componentId = `${inputId}-${componentIndex}`;
        const label = component.code.display || component.code.code;
        return (
          <div key={component.code.code} className="space-y-1.5">
            <Label htmlFor={componentId} className="text-sm text-gray-700">
              {label}
            </Label>
            <DiagnosticReportObservationInput
              id={componentId}
              label={label}
              value={data.value}
              unit={data.unit}
              dataType={component.permitted_data_type}
              disabled={disabled}
              onValueChange={(value) =>
                draft.handleComponentValueChange(
                  definition.id,
                  index,
                  component.code.code,
                  value,
                  data.unit,
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
}
