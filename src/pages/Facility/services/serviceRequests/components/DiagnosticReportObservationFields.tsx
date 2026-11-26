import { Fragment, type ReactNode } from "react";

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
  /** For components: sits beside the first field, with matching space beside the rest. */
  actions?: ReactNode;
}

/**
 * One field for a plain observation. For one with components, a label and a
 * field per component, as items of the group's two-column grid.
 */
export function DiagnosticReportObservationFields({
  reportId,
  definition,
  observation,
  index,
  disabled,
  draft,
  actions,
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
    <>
      {definition.component.map((component, componentIndex) => {
        const data = observation.components[component.code.code] ?? {
          value: "",
          unit: component.permitted_unit?.code || "",
        };
        const componentId = `${inputId}-${componentIndex}`;
        const label = component.code.display || component.code.code;
        return (
          <Fragment key={component.code.code}>
            <Label
              htmlFor={componentId}
              className="text-sm font-normal text-muted-foreground sm:min-h-12 md:min-h-10"
            >
              {label}
            </Label>
            <div className="flex min-w-0 items-start gap-2">
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
              {actions &&
                (componentIndex === 0 ? (
                  actions
                ) : (
                  <span
                    aria-hidden="true"
                    className="size-12 shrink-0 md:size-10"
                  />
                ))}
            </div>
          </Fragment>
        );
      })}
    </>
  );
}
