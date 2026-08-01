import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/base/code/code";
import { ResponseValue } from "@/types/questionnaire/form";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

export function QuantityInput({
  question,
  disabled,
  valueIndex,
}: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "quantity" ? entry.value : undefined;
  const coding = entry?.coding;

  const writeEntry = (next: ResponseValue) => {
    if (valueIndex === undefined) {
      updateResponse({ values: [next] });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, next),
    });
  };

  const handleValueChange = (raw: string) => {
    const numericValue = raw === "" ? undefined : parseFloat(raw);
    writeEntry({
      type: "quantity",
      value: numericValue,
      unit: question.unit,
      coding,
    });
  };

  const handleCodingChange = (newCoding: Code) => {
    writeEntry({
      type: "quantity",
      value,
      unit: question.unit,
      coding: newCoding,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:flex-wrap">
      {question.answer_value_set && (
        <div className="space-y-2">
          <Label htmlFor={`${question.id}-coding`}>{t("type")}</Label>
          <div className="w-full sm:w-[200px]">
            <ValueSetSelect
              system={question.answer_value_set.slug ?? ""}
              valuesetId={question.answer_value_set.external_id}
              value={coding ?? null}
              onSelect={handleCodingChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${question.id}-value`}>{t("value")}</Label>
        <Input
          id={`${question.id}-value`}
          type="number"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          value={value?.toString() ?? ""}
          onChange={(e) => handleValueChange(e.target.value)}
          step="0.01"
          disabled={disabled}
          className="w-[200px]"
        />
      </div>
    </div>
  );
}
