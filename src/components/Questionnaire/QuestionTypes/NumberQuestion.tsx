import { Input } from "@/components/ui/input";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface NumberQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  index: number;
}

export function NumberQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  index,
}: NumberQuestionProps) {
  const handleChange = (value: string) => {
    const emptyValue = value === "";
    const numericValue =
      question.type === "decimal" ? parseFloat(value) : parseInt(value);

    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "number",
      value: emptyValue ? undefined : numericValue,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <Input
      type="number"
      inputMode={question.type === "decimal" ? "decimal" : "numeric"}
      pattern={"[0-9]*[.]?[0-9]*"}
      value={questionnaireResponse.values[index]?.value?.toString() || ""}
      onChange={(e) => handleChange(e.target.value)}
      step={question.type === "decimal" ? "0.01" : "1"}
      disabled={disabled}
    />
  );
}
