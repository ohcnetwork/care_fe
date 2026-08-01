import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/base/code/code";
import { ResponseValue } from "@/types/questionnaire/form";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

/** Same UCUM valueset slug the legacy QuantityQuestion's unit picker
 *  searched (backend: CARE_UCUM_UNITS). */
const UCUM_SYSTEM_SLUG = "system-ucum-units";

export function QuantityInput({
  question,
  disabled,
  inputId,
  valueIndex,
}: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "quantity" ? entry.value : undefined;
  const coding = entry?.coding;
  // Per-answer unit (legacy contract): a unit picked on THIS entry wins;
  // the author's `question.unit` is only the pre-selected default. The
  // backend persists `unit` alone (`answer_unit` is silently dropped by the
  // Question spec), so the default must never be read from `answer_unit`.
  const pickedUnit = entry?.type === "quantity" ? entry.unit : undefined;
  const unit = pickedUnit ?? question.unit;

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
    // `unit` (picked ?? default) mirrors the legacy handleValueChange's
    // `unit: currentUnit` — changing the value never resets a picked unit.
    writeEntry({ type: "quantity", value: numericValue, unit, coding });
  };

  const handleUnitChange = (newUnit: Code) => {
    writeEntry({ type: "quantity", value, unit: newUnit, coding });
  };

  const handleCodingChange = (newCoding: Code) => {
    writeEntry({ type: "quantity", value, unit, coding: newCoding });
  };

  // Merged-row treatment (see QuestionField's bordered wrapper): each control
  // keeps its own left/top/bottom border and drops the right edge, so the
  // next zone's left border is the single separator — same pairing DateInput
  // and NumberInput use against the note affordance. Widths live on wrapper
  // divs because the global `button[role="combobox"] { width: 100% }` rule
  // (src/style/index.css) overrides any width utility on the trigger itself.
  return (
    <div className="flex w-full items-stretch">
      {question.answer_value_set && (
        <div className="flex w-40 shrink-0">
          <ValueSetSelect
            system={question.answer_value_set.slug ?? ""}
            valuesetId={question.answer_value_set.external_id}
            value={coding ?? null}
            onSelect={handleCodingChange}
            disabled={disabled}
            aria-label={t("type")}
            placeholder={t("type")}
            className="h-auto justify-between truncate rounded-r-none border-r-0 border-gray-300 font-normal shadow-none"
          />
        </div>
      )}
      <Input
        id={inputId}
        type="number"
        inputMode="decimal"
        pattern="[0-9]*[.]?[0-9]*"
        value={value?.toString() ?? ""}
        onChange={(e) => handleValueChange(e.target.value)}
        step="0.01"
        disabled={disabled}
        className={cn(
          "min-w-0 flex-1 rounded-r-none border-r-0",
          question.answer_value_set && "rounded-l-none",
        )}
      />
      <div className="flex w-36 shrink-0">
        <ValueSetSelect
          system={UCUM_SYSTEM_SLUG}
          value={unit ?? null}
          onSelect={handleUnitChange}
          disabled={disabled}
          aria-label={t("unit")}
          placeholder={t("unit")}
          className="h-auto justify-between truncate rounded-none border-r-0 border-gray-300 font-normal shadow-none"
        />
      </div>
    </div>
  );
}
