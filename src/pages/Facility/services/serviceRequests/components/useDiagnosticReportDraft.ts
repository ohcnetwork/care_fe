import { useState } from "react";

import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationStatus } from "@/types/emr/observation/observation";
import {
  ObservationDefinitionEmbedded,
  ObservationDefinitionRead,
} from "@/types/emr/observationDefinition/observationDefinition";

import {
  ObservationValue,
  ObservationsByDefinition,
} from "./diagnosticReportFormTypes";
import {
  emptyObservation,
  getReportDefinitions,
  getReportObservations,
} from "./diagnosticReportObservationUtils";

export function useDiagnosticReportDraft(
  fullReport: DiagnosticReportRead | undefined,
  observationDefinitions: ObservationDefinitionRead[],
) {
  const [observationDraft, setObservationDraft] =
    useState<ObservationsByDefinition | null>(null);
  const [addedDefinitions, setAddedDefinitions] = useState<
    ObservationDefinitionRead[]
  >([]);
  const [conclusionDraft, setConclusion] = useState<string | undefined>();
  const observations = observationDraft ?? getReportObservations(fullReport);
  const conclusion = conclusionDraft ?? fullReport?.conclusion ?? "";
  const definitionsById = getReportDefinitions(
    observationDefinitions,
    addedDefinitions,
    fullReport,
  );
  const reportDefinitions = [...definitionsById.values()];

  function setObservations(
    update: (previous: ObservationsByDefinition) => ObservationsByDefinition,
  ) {
    setObservationDraft((previous) =>
      update(previous ?? getReportObservations(fullReport)),
    );
  }

  function updateObservation(
    definitionId: string,
    index: number,
    update: (observation: ObservationValue) => ObservationValue,
  ) {
    setObservations((previous) => {
      const values = [...(previous[definitionId] ?? [])];
      values[index] = update(values[index] ?? emptyObservation());
      return { ...previous, [definitionId]: values };
    });
  }

  function handleValueChange(
    definitionId: string,
    index: number,
    value: string,
    unit = "",
  ) {
    setObservations((previous) => {
      const values = [...(previous[definitionId] ?? [])];
      values[index] = { ...(values[index] ?? emptyObservation(unit)), value };
      return { ...previous, [definitionId]: values };
    });
  }

  function handleUnitChange(definitionId: string, index: number, unit: string) {
    updateObservation(definitionId, index, (observation) => ({
      ...observation,
      unit,
    }));
  }

  function handleComponentValueChange(
    definitionId: string,
    index: number,
    componentCode: string,
    value: string,
    unit: string,
  ) {
    updateObservation(definitionId, index, (observation) => ({
      ...observation,
      components: {
        ...observation.components,
        [componentCode]: {
          ...observation.components[componentCode],
          value,
          unit,
        },
      },
    }));
  }

  function handleComponentUnitChange(
    definitionId: string,
    index: number,
    componentCode: string,
    unit: string,
  ) {
    updateObservation(definitionId, index, (observation) => ({
      ...observation,
      components: {
        ...observation.components,
        [componentCode]: {
          ...(observation.components[componentCode] ?? { value: "" }),
          unit,
        },
      },
    }));
  }

  function handleAddDefinition(definition: ObservationDefinitionRead) {
    setAddedDefinitions((previous) => [...previous, definition]);
    setObservations((previous) => ({
      ...previous,
      [definition.id]: [emptyObservation(definition.permitted_unit?.code)],
    }));
  }

  function handleAddResult(definition: ObservationDefinitionEmbedded) {
    setObservations((previous) => {
      const values = previous[definition.id] ?? [
        emptyObservation(definition.permitted_unit?.code),
      ];
      return {
        ...previous,
        [definition.id]: [
          ...values,
          emptyObservation(definition.permitted_unit?.code),
        ],
      };
    });
  }

  function handleDeleteObservation(definitionId: string, index: number) {
    const values = observations[definitionId];
    const observation = values?.[index];
    if (!observation) return;
    const isRequired = observationDefinitions.some(
      (definition) => definition.id === definitionId,
    );
    if (!isRequired && !observation.id && values.length === 1) {
      setAddedDefinitions((previous) =>
        previous.filter((definition) => definition.id !== definitionId),
      );
    }
    setObservations((previous) => {
      const current = previous[definitionId] ?? [];
      const updated = observation.id
        ? current.map((value, i) =>
            i === index
              ? { ...observation, status: ObservationStatus.ENTERED_IN_ERROR }
              : value,
          )
        : current.filter((_, i) => i !== index);
      return {
        ...previous,
        [definitionId]:
          updated.length > 0 || !isRequired ? updated : [emptyObservation()],
      };
    });
  }

  function resetDraft() {
    setObservationDraft(null);
    setAddedDefinitions([]);
    setConclusion(undefined);
  }

  return {
    observations,
    conclusion,
    setConclusion,
    addedDefinitions,
    definitionsById,
    reportDefinitions,
    handleValueChange,
    handleUnitChange,
    handleComponentValueChange,
    handleComponentUnitChange,
    handleAddDefinition,
    handleAddResult,
    handleDeleteObservation,
    resetDraft,
  };
}

export type DiagnosticReportDraft = ReturnType<typeof useDiagnosticReportDraft>;
