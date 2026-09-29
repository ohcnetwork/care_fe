import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote } from "./adapt";

import { SymptomInput } from "@/components/QuestionnaireV2/structured/inputs/SymptomInput";

export const symptomDefinition: StructuredTypeDefinition<"symptom"> = {
  type: "symptom",
  component: SymptomInput,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  draftPolicy: "serialize",
  buildRequests: async (
    symptoms,
    { patientId, encounterId, questionId, path },
  ) => {
    if (!patientId || !encounterId || symptoms.length === 0) return [];
    return [
      {
        url: `/api/v1/patient/${patientId}/symptom/upsert/`,
        method: "POST",
        body: {
          datapoints: symptoms.map((symptom) => ({
            ...symptom,
            note: sanitizeNote(symptom.note),
            encounter: encounterId,
          })),
        },
        reference_id: structuredReferenceId("symptom", questionId, path),
      },
    ];
  },
};
