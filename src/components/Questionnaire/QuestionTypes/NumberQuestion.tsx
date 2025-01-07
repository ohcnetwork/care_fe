import { Input } from "@/components/ui/input";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface NumberQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

export function NumberQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: NumberQuestionProps) {
  const handleChange = (value: string) => {
    const numericValue =
      question.type === "decimal" ? parseFloat(value) : parseInt(value);

    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "number",
          value: numericValue,
        },
      ],
    });
  };

  return (
    <Input
      type="number"
      value={questionnaireResponse.values[0]?.value?.toString() || ""}
      onChange={(e) => handleChange(e.target.value)}
      step={question.type === "decimal" ? "0.01" : "1"}
      disabled={disabled}
    />
  );
}
