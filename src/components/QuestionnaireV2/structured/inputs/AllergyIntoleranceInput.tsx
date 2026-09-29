import { AllergyQuestion } from "@/components/Questionnaire/QuestionTypes/AllergyQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function AllergyIntoleranceInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId) return null; // `requires` gates rendering
  return (
    <AllergyQuestion
      patientId={props.patientId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      initializeQuestionnaireResponseCB={props.onInitializeResponse}
      disabled={props.disabled}
    />
  );
}
