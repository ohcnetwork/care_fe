import { memo, useCallback, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useValueInjection } from "@/Utils/useValueInjectionObserver";
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
  clearError: () => void;
}

export const ChoiceQuestion = memo(function ChoiceQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled = false,
  clearError,
}: ChoiceQuestionProps) {
  const options = question.answer_option || [];
  const currentValue = questionnaireResponse.values[0]?.value?.toString();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const callbackRef = useCallback(
    (node: HTMLElement | null) => setElement(node),
    [],
  );

  const handleValueChange = (newValue: string) => {
    clearError();
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "string",
          value: newValue,
        },
      ],
    });
  };

  useValueInjection<string>({
    targetElement: element,
    attribute: "data-cui-listbox-value",
    onChange: (value) => value && handleValueChange(value),
  });

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Select
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-full"
          ref={callbackRef}
          data-cui-listbox
          data-cui-listbox-options={JSON.stringify(
            options.map((option) => [option.value, option.value?.toString()]),
          )}
          data-cui-listbox-value={JSON.stringify(currentValue)}
        >
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
    </div>
  );
});
