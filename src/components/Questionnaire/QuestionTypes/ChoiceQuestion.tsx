import { memo } from "react";

import { Label } from "@/components/ui/label";
import Select from "@/components/ui/select-util";

import { properCase } from "@/Utils/utils";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface ChoiceQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    questionnaireResponse: QuestionnaireResponse,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  index?: number;
}

export const ChoiceQuestion = memo(function ChoiceQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled = false,
  clearError,
  index = 0,
}: ChoiceQuestionProps) {
  const options = question.answer_option || [];
  const currentValue = questionnaireResponse.values[index]?.value?.toString();

  const handleValueChange = (newValue: string) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "string",
      value: newValue,
    };

    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: newValues,
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Select
        value={currentValue}
        onChange={handleValueChange}
        disabled={disabled}
        options={options.map((option) => ({
          label: properCase(option.display || option.value),
          value: option.value.toString(),
        }))}
      />
    </div>
  );
});
