import { memo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { properCase } from "@/Utils/utils";
import { Code } from "@/types/questionnaire/code";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { AnswerOption, Question } from "@/types/questionnaire/question";

interface ChoiceQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
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
  const currentCoding = questionnaireResponse.values[index]?.coding;
  const handleValueChange = (newValue: string) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "string",
      value: newValue,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleCodingChange = (newValue: Code) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "quantity",
      coding: {
        code: newValue.code,
        system: newValue.system,
        display: newValue.display,
      },
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };
  return (
    <>
      {question.answer_value_set ? (
        <ValueSetSelect
          system={question.answer_value_set}
          value={currentCoding}
          onSelect={handleCodingChange}
        ></ValueSetSelect>
      ) : (
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
      )}
    </>
  );
});
