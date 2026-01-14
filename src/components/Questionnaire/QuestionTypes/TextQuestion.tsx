import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { TemplateSelector } from "@/components/Questionnaire/QuestionTypes/TemplateSelector";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface TextQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  index: number;
}

export function TextQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  index,
}: TextQuestionProps) {
  const handleChange = (value: string) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "string",
      value,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleAddTemplates = (contents: string[]) => {
    clearError();
    const newValues = [...questionnaireResponse.values];

    // Append to the first value (index 0)
    const currentValue = newValues[0]?.value?.toString() || "";
    const appendedContent = contents.join("\n");
    const newValue = currentValue
      ? `${currentValue} ${appendedContent}`
      : appendedContent;

    newValues[0] = {
      type: "string",
      value: newValue,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <>
      {question.type === "text" ? (
        <Textarea
          value={questionnaireResponse.values[index]?.value?.toString() || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[100px]"
          disabled={disabled}
        />
      ) : (
        <Input
          type="text"
          value={questionnaireResponse.values[index]?.value?.toString() || ""}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        />
      )}
      {index === 0 && question.templates && (
        <TemplateSelector
          templates={question.templates}
          onAddTemplates={handleAddTemplates}
          disabled={disabled}
        />
      )}
    </>
  );
}
