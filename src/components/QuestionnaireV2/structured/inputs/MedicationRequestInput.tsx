import { MedicationRequestQuestion } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function MedicationRequestInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId || !props.encounterId) return null;
  return (
    <MedicationRequestQuestion
      patientId={props.patientId}
      encounterId={props.encounterId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      initializeQuestionnaireResponseCB={props.onInitializeResponse}
      disabled={props.disabled}
      errors={props.errors}
      questionnaireId={props.questionnaireId}
      questionnaireSlug={props.questionnaireSlug}
    />
  );
}
