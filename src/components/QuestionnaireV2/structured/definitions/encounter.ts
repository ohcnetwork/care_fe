import { validateEncounterQuestion } from "@/components/Questionnaire/QuestionTypes/EncounterQuestion";

import type {
  StructuredBatchEntry,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { EncounterInput } from "@/components/QuestionnaireV2/structured/inputs/EncounterInput";

export const encounterDefinition: StructuredTypeDefinition<"encounter"> = {
  type: "encounter",
  component: EncounterInput,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  draftPolicy: "serialize",
  validate: (encounters, questionId) =>
    encounters.flatMap((encounter) =>
      validateEncounterQuestion(encounter, questionId),
    ),
  buildRequests: async (
    encounters,
    { encounterId, facilityId, questionId, path },
  ) => {
    if (!encounterId) return [];
    if (!facilityId) {
      throw new Error("Cannot update an encounter without a facility");
    }
    if (encounters.length > 1) {
      throw new Error("An encounter question cannot hold more than one entry");
    }
    return encounters.map((encounter): StructuredBatchEntry => ({
      url: `/api/v1/encounter/${encounterId}/`,
      method: "PUT",
      body: {
        status: encounter.status,
        period: encounter.period,
        hospitalization: encounter.hospitalization,
        priority: encounter.priority,
        external_identifier: encounter.external_identifier,
        discharge_summary_advice: encounter.discharge_summary_advice,
      },
      reference_id: structuredReferenceId("encounter", questionId, path),
    }));
  },
};
