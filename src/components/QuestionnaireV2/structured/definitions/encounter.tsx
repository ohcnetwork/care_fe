import {
  EncounterQuestion,
  validateEncounterQuestion,
} from "@/components/Questionnaire/QuestionTypes/EncounterQuestion";

import type {
  StructuredBatchEntry,
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { useLegacyResponseCallback } from "./adapt";

function EncounterInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.encounterId || !props.facilityId) return null;
  return (
    <EncounterQuestion
      question={props.question}
      encounterId={props.encounterId}
      facilityId={props.facilityId}
      patientId={props.patientId}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
      clearError={props.clearError}
    />
  );
}

export const encounterDefinition: StructuredTypeDefinition<"encounter"> = {
  type: "encounter",
  component: EncounterInput,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  draftPolicy: "exclude",
  contract: 1,
  validate: (encounters, questionId) =>
    validateEncounterQuestion(encounters[0], questionId),
  buildRequests: async (
    encounters,
    { encounterId, facilityId, questionId },
  ) => {
    if (!encounterId) return [];
    if (!facilityId) {
      throw new Error("Cannot update an encounter without a facility");
    }
    return encounters.map((encounter): StructuredBatchEntry => ({
      url: `/api/v1/encounter/${encounterId}/`,
      method: "PUT",
      body: {
        status: encounter.status,
        encounter_class: encounter.encounter_class,
        period: encounter.period,
        hospitalization: encounter.hospitalization,
        priority: encounter.priority,
        external_identifier: encounter.external_identifier,
        discharge_summary_advice: encounter.discharge_summary_advice,
      },
      reference_id: structuredReferenceId("encounter", questionId),
    }));
  },
};
