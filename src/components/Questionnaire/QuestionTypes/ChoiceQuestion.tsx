import { t } from "i18next";
import { memo } from "react";

import Autocomplete from "@/components/ui/autocomplete";
import { MultiSelect } from "@/components/ui/multi-select";

import RadioInput from "@/components/Questionnaire/RadioInput";
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
    newValues[index] = { type: "string", value: newValue };

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
