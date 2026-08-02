import { SymptomQuestion } from "@/components/Questionnaire/QuestionTypes/SymptomQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote, useLegacyResponseCallback } from "./adapt";

function SymptomInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId || !props.encounterId) return null;
  return (
    <SymptomQuestion
      patientId={props.patientId}
      encounterId={props.encounterId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
    />
  );
}

export const symptomDefinition: StructuredTypeDefinition<"symptom"> = {
  type: "symptom",
  component: SymptomInput,
  requires: ["patientId", "encounterId"],
  draftPolicy: "exclude",
  buildRequests: async (symptoms, { patientId, encounterId, questionId }) => {
    if (!encounterId || symptoms.length === 0) return [];
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
        reference_id: structuredReferenceId("symptom", questionId),
      },
    ];
  },
};
