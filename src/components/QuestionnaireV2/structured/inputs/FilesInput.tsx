import { FilesQuestion } from "@/components/Questionnaire/QuestionTypes/FileQuestion";

import { useLegacyResponseCallback } from "@/components/QuestionnaireV2/structured/definitions/adapt";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

export function FilesInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.encounterId) return null;
  return (
    <FilesQuestion
      question={props.question}
      encounterId={props.encounterId}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
    />
  );
}
