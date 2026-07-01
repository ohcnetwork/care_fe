import { t } from "i18next";
import { memo } from "react";
import { toast } from "sonner";

import RadioInput from "@/components/ui/RadioInput";
import Autocomplete from "@/components/ui/autocomplete";
import { MultiSelect } from "@/components/ui/multi-select";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { cn } from "@/lib/utils";
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
  disableRightBorder?: boolean;
  index?: number;
}

export const ChoiceQuestion = memo(function ChoiceQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled = false,
  clearError,
  disableRightBorder,
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

  const handleClearSelection = (idx?: number) => {
    clearError();
    const newValues =
      idx === undefined
        ? []
        : questionnaireResponse.values.filter((_, i) => i !== idx);
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
          onClear={handleClearSelection}
          disabled={disabled}
          disableRightBorder={disableRightBorder}
        />
      );
    }
    return (
      <>
        {questionnaireResponse.values.map((value, idx) => (
          <div key={value.coding?.code} className="mb-2">
            <ValueSetSelect
              system={question.answer_value_set!}
              value={value.coding}
              onSelect={(newValue) => handleCodingChange(newValue, idx)}
              onClear={() => handleClearSelection(idx)}
              disabled={disabled}
              disableRightBorder={disableRightBorder}
            />
          </div>
        ))}

        <ValueSetSelect
          closeOnSelect={false}
          system={question.answer_value_set}
          value={null}
          onSelect={handleCodingChange}
          disableRightBorder={disableRightBorder}
        />
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
          label: option.display || option.value,
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
          label: option.display || option.value,
          value: option.value.toString(),
        }))}
        placeholder={t("select_an_option")}
        disabled={disabled}
        className={cn(
          "border-gray-300",
          disableRightBorder && !currentValue
            ? "rounded-r-none border-r-0"
            : "",
        )}
        clearButtonClassName={cn(
          disableRightBorder ? "border-gray-300 rounded-r-none border-r-0" : "",
        )}
      />
    );
  }

  const selectedValue = questionnaireResponse.values[index]?.value?.toString();

  return (
    <div className="mt-2">
      <RadioInput
        options={options.map((option) => ({
          label: option.display || option.value,
          value: option.value.toString(),
        }))}
        value={selectedValue ?? ""}
        onValueChange={handleValueChange}
        disabled={disabled}
      />
    </div>
  );
});
