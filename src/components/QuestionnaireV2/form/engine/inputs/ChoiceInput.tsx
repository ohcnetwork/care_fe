import type { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";

import { FixedChoiceInput } from "./FixedChoiceInput";
import { ValueSetChoiceInput } from "./ValueSetChoiceInput";

/** Fixed answer options take precedence when both sources are configured. */
export function ChoiceInput(props: RendererInputProps) {
  const { question } = props;
  if (question.answer_option?.length) {
    return <FixedChoiceInput {...props} options={question.answer_option} />;
  }
  if (question.answer_value_set) {
    return (
      <ValueSetChoiceInput {...props} valueSet={question.answer_value_set} />
    );
  }
  return null;
}
