import { ServiceRequestQuestion } from "@/components/Questionnaire/QuestionTypes/ServiceRequestQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function ServiceRequestInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.encounterId || !props.facilityId) return null;
  return (
    <ServiceRequestQuestion
      encounterId={props.encounterId}
      facilityId={props.facilityId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
      questionnaireSlug={props.questionnaireSlug}
    />
  );
}
