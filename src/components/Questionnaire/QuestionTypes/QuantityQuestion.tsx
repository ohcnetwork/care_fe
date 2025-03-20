import { memo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/questionnaire/code";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

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
  index?: number;
}

export const QuantityQuestion = memo(function QuantityQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled = false,
  clearError,
  index = 0,
}: QuantityQuestionProps) {
  const currentValue = questionnaireResponse.values[index]?.value as
    | number
    | undefined;
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

  return (
    <div className="flex gap-4">
      {question.answer_value_set && (
        <div className="space-y-2">
          <Label htmlFor={`${question.id}-coding`}>Type</Label>
          <div className="w-[200px]">
            <ValueSetSelect
              system={question.answer_value_set}
              value={currentCoding}
              onSelect={handleCodingChange}
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${question.id}-value`}>Value</Label>
        <Input
          id={`${question.id}-value`}
          type="number"
          value={currentValue?.toString() || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          step="0.01"
          disabled={disabled}
          className="w-[200px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${question.id}-unit`}>Unit</Label>
        <div className="w-[200px]">
          <ValueSetSelect
            system="system-ucum-units"
            value={currentUnit}
            onSelect={handleUnitChange}
          />
        </div>
      </div>
    </div>
  );
});
