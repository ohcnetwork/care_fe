import { EncounterQuestion } from "@/components/Questionnaire/QuestionTypes/EncounterQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function EncounterInput(props: StructuredInputProps) {
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
      initializeQuestionnaireResponseCB={props.onInitializeResponse}
      disabled={props.disabled}
      errors={props.errors}
      clearError={props.clearError}
    />
  );
}
