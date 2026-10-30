import { SymptomQuestion } from "@/components/Questionnaire/QuestionTypes/SymptomQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function SymptomInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId || !props.encounterId) return null;
  return (
    <SymptomQuestion
      patientId={props.patientId}
      encounterId={props.encounterId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      initializeQuestionnaireResponseCB={props.onInitializeResponse}
      disabled={props.disabled}
    />
  );
}
