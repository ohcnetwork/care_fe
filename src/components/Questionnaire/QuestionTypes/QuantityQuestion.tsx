import { memo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/base/code/code";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import { useTranslation } from "react-i18next";

interface QuantityQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  disableRightBorder?: boolean;
  index?: number;
}

export const QuantityQuestion = memo(function QuantityQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled = false,
  clearError,
  disableRightBorder,
  index = 0,
}: QuantityQuestionProps) {
  const { t } = useTranslation();
  const currentValue = questionnaireResponse.values[index]?.value as
    number | undefined;
  const currentUnit = questionnaireResponse.values[index]?.unit;
  const currentCoding = questionnaireResponse.values[index]?.coding;

  const handleValueChange = (value: string) => {
    clearError();
    const numericValue = value === "" ? undefined : parseFloat(value);
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "quantity",
      value: numericValue,
      unit: currentUnit,
      coding: currentCoding,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleUnitChange = (newUnit: Code) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "quantity",
      value: currentValue,
      unit: newUnit,
      coding: currentCoding,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleCodingChange = (newCoding: Code) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "quantity",
      value: currentValue,
      unit: currentUnit,
      coding: newCoding,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleClearUnit = () => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "quantity",
      value: currentValue,
      unit: undefined,
      coding: currentCoding,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleClearCoding = () => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "quantity",
      value: currentValue,
      unit: currentUnit,
      coding: undefined,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {question.answer_value_set && (
        <div className="space-y-2 sm:flex-1">
          <Label htmlFor={`${question.id}-coding`}>{t("type")}</Label>
          <div className="w-full">
            <ValueSetSelect
              system={question.answer_value_set}
              value={currentCoding}
              onSelect={handleCodingChange}
              onClear={handleClearCoding}
              disabled={disabled}
            />
          </div>
        </div>
      )}
      <div className="space-y-2 sm:flex-1">
        <Label htmlFor={`${question.id}-value`}>{t("value")}</Label>
        <Input
          id={`${question.id}-value`}
          type="number"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          value={currentValue?.toString() || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          step="0.01"
          disabled={disabled}
          className="w-full h-9"
        />
      </div>
      <div className="space-y-2 sm:flex-1">
        <Label htmlFor={`${question.id}-unit`}>{t("unit")}</Label>
        <div className="w-full">
          <ValueSetSelect
            system="system-ucum-units"
            value={currentUnit}
            onSelect={handleUnitChange}
            onClear={handleClearUnit}
            disabled={disabled}
            disableRightBorder={disableRightBorder}
          />
        </div>
      </div>
    </div>
  );
});
