import { TimeOfDeathQuestion } from "@/components/Questionnaire/QuestionTypes/DeathQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function TimeOfDeathInput(props: StructuredInputProps) {
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
