import { AllergyQuestion } from "@/components/Questionnaire/QuestionTypes/AllergyQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote, useLegacyResponseCallback } from "./adapt";

function AllergyIntoleranceInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId) return null; // `requires` gates rendering
  return (
    <AllergyQuestion
      patientId={props.patientId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
    />
  );
}

export const allergyIntoleranceDefinition: StructuredTypeDefinition<"allergy_intolerance"> =
  {
    type: "allergy_intolerance",
    component: AllergyIntoleranceInput,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    draftPolicy: "exclude",
    buildRequests: async (
      allergies,
      { patientId, encounterId, questionId },
    ) => {
      // `subjects` is encounter-only, so a patient is always in scope here
      // — narrowed rather than asserted (the context type is optional for
      // plugin types that declare a resource subject).
      if (!patientId || !encounterId || allergies.length === 0) return [];
      return [
        {
          url: `/api/v1/patient/${patientId}/allergy_intolerance/upsert/`,
          method: "POST",
          body: {
            datapoints: allergies.map((allergy) => ({
              ...allergy,
              note: sanitizeNote(allergy.note),
              encounter: encounterId,
            })),
          },
          reference_id: structuredReferenceId(
            "allergy_intolerance",
            questionId,
          ),
        },
      ];
    },
  };
