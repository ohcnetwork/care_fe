import { t } from "i18next";
import { memo } from "react";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

import RadioInput from "@/components/Questionnaire/RadioInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { properCase } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
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
    question.answer_option?.length && question.answer_option?.length > 5
      ? "dropdown"
      : "radio";
  const currentValue = questionnaireResponse.values[index]?.value?.toString();
  const currentCoding = questionnaireResponse.values[index]?.coding;
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

  if (question.answer_value_set) {
    if (!question.repeats) {
      return (
        <ValueSetSelect
          system={question.answer_value_set}
          value={currentCoding}
          onSelect={(newValue) => handleCodingChange(newValue, 0)}
        ></ValueSetSelect>
      );
    }
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
            closeOnSelect={false}
            system={question.answer_value_set}
            value={null}
            onSelect={handleCodingChange}
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
      <RadioInput
        options={options.map((option) => ({
          label: properCase(option.display || option.value),
          value: option.value.toString(),
        }))}
        value={selectedValue ?? ""}
        onValueChange={handleValueChange}
        disabled={disabled}
      />
    </div>
  );
});
