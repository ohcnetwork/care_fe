import { TimeOfDeathQuestion } from "@/components/Questionnaire/QuestionTypes/DeathQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { useLegacyResponseCallback } from "./adapt";

function TimeOfDeathInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  return (
    <TimeOfDeathQuestion
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
    />
  );
}

export const timeOfDeathDefinition: StructuredTypeDefinition<"time_of_death"> =
  {
    type: "time_of_death",
    component: TimeOfDeathInput,
    requires: [],
    subjects: ["patient", "encounter"],
    draftPolicy: "exclude",
    buildRequests: async (timeOfDeaths, { patientId, questionId }) => {
      // `subjects` is patient/encounter, so a patient is always in scope
      // here — narrowed rather than asserted (the context type is optional
      // for plugin types that declare a resource subject).
      if (!patientId) return [];
      return timeOfDeaths.map((deceasedDatetime) => ({
        url: `/api/v1/patient/${patientId}/`,
        method: "PUT" as const,
        body: {
          deceased_datetime: deceasedDatetime,
        },
        reference_id: structuredReferenceId("time_of_death", questionId),
      }));
    },
  };
