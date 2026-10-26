import { Code } from "@/types/base/code/code";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  ObservationComponent,
  ObservationStatus,
  ObservationUpsertRequest,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";
import {
  ObservationDefinitionComponent,
  ObservationDefinitionEmbedded,
  ObservationDefinitionRead,
} from "@/types/emr/observationDefinition/observationDefinition";
import { hasMarkdownContent } from "@/Utils/markdown";

import {
  ComponentValue,
  ObservationValue,
  ObservationsByDefinition,
} from "./diagnosticReportFormTypes";

export function emptyObservation(unit = ""): ObservationValue {
  return {
    id: "",
    value: "",
    unit,
    status: ObservationStatus.AMENDED,
    components: {},
  };
}

export function getReportObservations(
  report?: DiagnosticReportRead,
): ObservationsByDefinition {
  const values: ObservationsByDefinition = {};
  for (const observation of report?.observations ?? []) {
    if (
      !observation.observation_definition ||
      observation.status === ObservationStatus.ENTERED_IN_ERROR
    )
      continue;
    const components: Record<string, ComponentValue> = {};
    for (const component of observation.component ?? []) {
      if (!component.code) continue;
      components[component.code.code] = {
        value: component.value.value ?? "",
        unit: component.value.unit?.code ?? "",
        interpretation: component.interpretation,
      };
    }
    const definitionId = observation.observation_definition.id;
    (values[definitionId] ??= []).push({
      id: observation.id,
      value: observation.value.value ?? "",
      unit: observation.value.unit?.code ?? "",
      interpretation: observation.interpretation,
      status: observation.status,
      components,
    });
  }
  return values;
}

export function getReportDefinitions(
  required: ObservationDefinitionRead[],
  added: ObservationDefinitionRead[],
  report?: DiagnosticReportRead,
) {
  const definitions = new Map<string, ObservationDefinitionEmbedded>(
    required.map((definition) => [definition.id, definition]),
  );
  for (const observation of report?.observations ?? []) {
    const definition = observation.observation_definition;
    if (
      definition &&
      observation.status !== ObservationStatus.ENTERED_IN_ERROR
    ) {
      definitions.set(definition.id, {
        ...definitions.get(definition.id),
        ...definition,
      });
    }
  }
  for (const definition of added) definitions.set(definition.id, definition);
  return definitions;
}

export function observationHasValue(observation: ObservationValue) {
  if (observation.status === ObservationStatus.ENTERED_IN_ERROR) return false;
  return (
    observation.value.trim() !== "" ||
    Object.values(observation.components).some(
      (component) => component.value.trim() !== "",
    )
  );
}

export function getReportValidationError(
  observations: ObservationsByDefinition,
  conclusion: string,
  hasRequiredDefinitions: boolean,
) {
  if (!hasRequiredDefinitions) return;
  const values = Object.values(observations).flat();
  if (values.some(observationHasValue)) return;
  if (hasMarkdownContent(conclusion))
    return "cannot_add_conclusion_without_results";
  if (
    !values.some((value) => value.status === ObservationStatus.ENTERED_IN_ERROR)
  )
    return "please_fill_all_results";
}

function formatResultValue(
  data: ComponentValue,
  permittedUnit?: Code | null,
): QuestionnaireSubmitResultValue {
  const value: QuestionnaireSubmitResultValue = { value: data.value };
  if (data.unit && permittedUnit) {
    value.unit = {
      code: data.unit,
      system: permittedUnit.system,
      display: permittedUnit.display || data.unit,
    };
  }
  return value;
}

function formatComponents(
  data: ObservationValue,
  definitions: ObservationDefinitionComponent[],
): ObservationComponent[] {
  return definitions.flatMap((definition) => {
    const component = data.components[definition.code.code];
    if (!component?.value.trim()) return [];
    return [
      {
        code: definition.code,
        value: formatResultValue(component, definition.permitted_unit),
      },
    ];
  });
}

function shouldSaveObservation(
  data: ObservationValue,
  definition: ObservationDefinitionEmbedded,
) {
  if (data.id && data.status === ObservationStatus.ENTERED_IN_ERROR)
    return true;
  if (definition.component?.length) {
    return Object.values(data.components).some(
      (component) => component.value.trim() !== "",
    );
  }
  return data.value.trim() !== "";
}

function formatObservation(
  data: ObservationValue,
  definition: ObservationDefinitionEmbedded,
  slug?: string,
): ObservationUpsertRequest {
  const components = formatComponents(data, definition.component ?? []);
  return {
    ...(data.id
      ? { observation_id: data.id }
      : { observation_definition: slug }),
    observation: {
      status:
        data.status === ObservationStatus.ENTERED_IN_ERROR
          ? ObservationStatus.ENTERED_IN_ERROR
          : ObservationStatus.FINAL,
      value_type: definition.permitted_data_type || "decimal",
      effective_datetime: new Date().toISOString(),
      value: formatResultValue(data, definition.permitted_unit),
      component: components.length > 0 ? components : undefined,
    },
  };
}

export function formatReportObservations(
  observations: ObservationsByDefinition,
  definitions: Map<string, ObservationDefinitionEmbedded>,
  slugs: Map<string, string>,
): ObservationUpsertRequest[] {
  return Object.entries(observations).flatMap(([definitionId, values]) => {
    if (values.length === 0) return [];
    const definition = definitions.get(definitionId);
    if (!definition) throw new Error("Missing observation definition");
    return values
      .filter((value) => shouldSaveObservation(value, definition))
      .map((value) =>
        formatObservation(value, definition, slugs.get(definitionId)),
      );
  });
}
