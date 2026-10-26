import { AppointmentQuestion } from "@/components/Questionnaire/QuestionTypes/AppointmentQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function AppointmentInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.facilityId) return null;
  return (
    <AppointmentQuestion
      question={props.question}
      facilityId={props.facilityId}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
    />
  );
}
