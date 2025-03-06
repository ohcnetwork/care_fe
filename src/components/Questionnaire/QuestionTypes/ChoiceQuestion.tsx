import { memo, useState } from "react";

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
  const [currentCode, setCurrentCode] = useState<Code>(() => {
    const existingValue =
      questionnaireResponse.values[index]?.value?.toString();
    return {
      system: question.answer_value_set ?? "",
      code: "",
      display: existingValue ?? "",
    };
  });
  const handleValuesetSelectChange = (code: Code) => {
    clearError();
    setCurrentCode(code);
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "string",
      value: code.display,
    };
    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };
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

  return (
    <>
      {question.answer_value_set ? (
        <ValueSetSelect
          value={currentCode}
          system={question.answer_value_set}
          placeholder="Search and Select an option"
          onSelect={handleValuesetSelectChange}
          disabled={disabled}
        />
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
