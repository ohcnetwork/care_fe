import { t } from "i18next";
import { memo } from "react";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { properCase } from "@/Utils/utils";
import { Code } from "@/types/questionnaire/code";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

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
    question.answer_option?.length && question.answer_option?.length > 4
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

  const handleMultiSelectChange = (values: string[]) => {
    clearError();
    const newValues = values.map((value) => ({
      type: "string" as const,
      value: value,
    }));

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  if (question.answer_value_set) {
    return (
      <ValueSetSelect
        system={question.answer_value_set}
        value={currentCoding}
        onSelect={handleCodingChange}
      ></ValueSetSelect>
    );
  }

  if (question.repeats) {
    return (
      <MultiSelect
        value={questionnaireResponse.values.map(
          (v) => v.value?.toString() || "",
        )}
        onValueChange={handleMultiSelectChange}
        options={options.map((option) => ({
          label: properCase(option.display || option.value),
          value: option.value.toString(),
        }))}
        placeholder={t("select_an_option")}
        disabled={disabled}
        id={`choice-${question.id}`}
      />
    );
  }

  if (selectType === "dropdown") {
    return (
      <Autocomplete
        value={currentValue || ""}
        onChange={handleValueChange}
        options={options.map((option) => ({
          label: properCase(option.display || option.value),
          value: option.value.toString(),
        }))}
        placeholder={t("select_an_option")}
        disabled={disabled}
      />
    );
  }

  const selectedValue = questionnaireResponse.values[index]?.value?.toString();

  return (
    <div className="mt-2">
      <RadioGroup
        onValueChange={handleValueChange}
        disabled={disabled}
        className="flex flex-wrap gap-4 ml-2"
        value={selectedValue}
      >
        {options.map((option) => (
          <div
            className={cn(
              "border rounded-md p-2 w-full cursor-pointer sm:w-auto hover:border-primary-500 group",

              selectedValue === option.value
                ? "bg-primary-100 border-primary-500"
                : "border-gray-300",
            )}
            key={`${question.id}-${option.value.toString()}`}
          >
            <div className="flex items-center space-x-2 ">
              <RadioGroupItem
                value={option.value.toString()}
                id={`${question.id}-${option.value.toString()}`}
                className="h-4 w-4 border-2 border-gray-300 text-primary focus:ring-primary group-hover:border-primary-500"
              />
              <Label
                htmlFor={`${question.id}-${option.value.toString()}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed cursor-pointer peer-disabled:opacity-70"
              >
                {properCase(option.display || option.value)}
              </Label>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
});
