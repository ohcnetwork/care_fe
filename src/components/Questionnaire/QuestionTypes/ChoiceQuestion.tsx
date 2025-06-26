import { t } from "i18next";
import { memo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
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
  const [isOpen, setIsOpen] = useState(false);
  const handleValueChange = (newValue: string) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = { type: "string", value: newValue };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleCodingChange = (newValue: Code, idx?: number) => {
    clearError();
    const newValues = [...questionnaireResponse.values];

    const newResponseValue = {
      type: "quantity",
      coding: {
        code: newValue.code,
        system: newValue.system,
        display: newValue.display,
      },
    } as ResponseValue;

    if (newValues.some((value) => value.coding?.code === newValue.code)) {
      toast.error(t("value_already_selected"));
      return;
    }

    if (idx === undefined) {
      updateQuestionnaireResponseCB(
        [...newValues, newResponseValue],
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
      return;
    }

    newValues[idx] = newResponseValue;

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

  if (question.answer_value_set && !question.repeats) {
    return (
      <ValueSetSelect
        system={question.answer_value_set}
        value={currentCoding}
        onSelect={handleCodingChange}
      ></ValueSetSelect>
    );
  }

  if (question.answer_value_set) {
    return (
      <>
        {questionnaireResponse.values.map((value, idx) => {
          return (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <ValueSetSelect
                  system={question.answer_value_set!}
                  value={value.coding}
                  onSelect={(newValue) => handleCodingChange(newValue, idx)}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newValues = questionnaireResponse.values.filter(
                    (_, i) => i !== idx,
                  );
                  updateQuestionnaireResponseCB(
                    newValues,
                    questionnaireResponse.question_id,
                  );
                }}
              >
                <CareIcon icon="l-trash" className="size-4" />
              </Button>
            </div>
          );
        })}

        <div>
          <ValueSetSelect
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            system={question.answer_value_set}
            value={null}
            onSelect={(newValue) => {
              handleCodingChange(newValue);
              setTimeout(() => {
                setIsOpen(true);
              }, 100);
            }}
          />
        </div>
      </>
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
        className="bg-white"
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
          <button
            type="button"
            className={cn(
              "border rounded-md p-2 w-full cursor-pointer sm:w-auto hover:border-primary-500 group text-left",
              selectedValue === option.value
                ? "bg-primary-100 border-primary-500"
                : "bg-white border-gray-300",
            )}
            key={`${question.id}-${option.value.toString()}`}
            onClick={() => handleValueChange(option.value.toString())}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
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
          </button>
        ))}
      </RadioGroup>
    </div>
  );
});
