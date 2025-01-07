import { memo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { properCase } from "@/Utils/utils";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { AnswerOption, Question } from "@/types/questionnaire/question";

interface ChoiceQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    questionnaireResponse: QuestionnaireResponse,
  ) => void;
  disabled?: boolean;
  withLabel?: boolean;
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
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option: AnswerOption) => (
          <SelectItem
            key={option.value.toString()}
            value={option.value.toString()}
          >
            {properCase(option.display || option.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
