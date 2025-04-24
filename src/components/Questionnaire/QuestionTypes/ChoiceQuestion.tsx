import { memo } from "react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const selectType =
    question.answer_option?.length && question.answer_option?.length > 5
      ? "dropdown"
      : "radio";
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
      ) : selectType === "dropdown" ? (
        <Select
          value={currentValue}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="max-w-[var(--radix-select-trigger-width)] w-full">
            {options.map((option: AnswerOption) => (
              <SelectItem
                key={`${question.id}-${option.value.toString()}`}
                value={option.value.toString()}
                className="whitespace-normal break-words py-3"
              >
                {properCase(option.display || option.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="mt-2">
          <RadioGroup
            onValueChange={handleValueChange}
            disabled={disabled}
            className="flex flex-col gap-3"
          >
            {options.map((option: AnswerOption) => (
              <Label
                htmlFor={`${question.id}-${option.value.toString()}`}
                className="cursor-pointer"
                key={`${question.id}-${option.value.toString()}`}
              >
                <Card
                  className="shadow-none rounded-md border-1 border-gray-400 bg-gray-200 p-2 transition-all hover:bg-gray-50/90 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary-300 [&:has([data-state=checked])]:shadow-sm w-full"
                  role="presentation"
                >
                  <div className="flex flex-row items-center gap-2">
                    <RadioGroupItem
                      value={option.value.toString()}
                      id={`${question.id}-${option.value.toString()}`}
                      className="sr-only"
                    />
                    <div className="font-medium leading-5">
                      {properCase(option.display || option.value)}
                    </div>
                  </div>
                </Card>
              </Label>
            ))}
          </RadioGroup>
        </div>
      )}
    </>
  );
});
