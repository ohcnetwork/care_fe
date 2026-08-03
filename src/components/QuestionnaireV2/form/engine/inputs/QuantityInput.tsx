import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/base/code/code";
import { ResponseValue } from "@/types/questionnaire/form";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";
import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";
import { useValueSetExpansion } from "@/components/QuestionnaireV2/shared/useValueSetExpansion";

import { withEntryAt } from "./withEntryAt";

/** Same UCUM valueset slug the legacy QuantityQuestion's unit picker
 *  searched (backend: CARE_UCUM_UNITS). Fallback source when the question
 *  has no unit valueset of its own. */
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
  // Per-answer unit: a unit picked on THIS entry wins; the author's
  // `question.unit` is only the pre-selected default. The backend persists
  // `unit` alone (`answer_unit` is silently dropped by the Question spec),
  // so the default must never be read from `answer_unit`.
  const pickedUnit = entry?.type === "quantity" ? entry.unit : undefined;
  const unit = pickedUnit ?? question.unit;

  // The question's unit valueset (owner-directed v2 semantics: for quantity,
  // `answer_value_set` IS the unit-choice source). A bounded expansion
  // renders every unit as a visible chip; large/failed expansions keep the
  // search popover, scoped to the same valueset.
  const { boundedCodes } = useValueSetExpansion(question.answer_value_set);

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

  // Merged-row treatment (see QuestionBlock's single-border model): each control
  // keeps its own left/top/bottom border and drops the right edge, so the
  // next zone's left border is the single separator — same pairing DateInput
  // and NumberInput use against the note affordance. Widths live on wrapper
  // divs because the global `button[role="combobox"] { width: 100% }` rule
  // (src/style/index.css) overrides any width utility on the trigger itself.
  if (boundedCodes) {
    // Bounded unit set → every choice is visible: value input on top, one
    // radio chip per unit beneath (author's default pre-selected).
    return (
      <div className="flex w-full flex-col">
        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          aria-required={question.required || undefined}
          value={value?.toString() ?? ""}
          onChange={(e) => handleValueChange(e.target.value)}
          step="0.01"
          disabled={disabled}
          className="rounded-none border-x-0 border-t-0"
        />
        <div
          role="radiogroup"
          aria-label={t("unit")}
          className="flex flex-wrap gap-2 p-2"
        >
          {boundedCodes.map((code) => (
            <ChoiceChip
              key={code.code}
              control="radio"
              label={code.display || code.code}
              checked={unit?.code === code.code}
              disabled={disabled}
              onCheckedChange={() => handleUnitChange(code)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-stretch">
      <Input
        id={inputId}
        type="number"
        inputMode="decimal"
        pattern="[0-9]*[.]?[0-9]*"
        aria-required={question.required || undefined}
        value={value?.toString() ?? ""}
        onChange={(e) => handleValueChange(e.target.value)}
        step="0.01"
        disabled={disabled}
        className="min-w-0 flex-1 rounded-r-none border-r-0"
      />
      <div className="flex w-36 shrink-0">
        <ValueSetSelect
          system={question.answer_value_set?.slug ?? UCUM_SYSTEM_SLUG}
          valuesetId={question.answer_value_set?.external_id}
          value={unit ?? null}
          onSelect={handleUnitChange}
          disabled={disabled}
          aria-label={t("unit")}
          placeholder={t("unit")}
          className="h-auto justify-between truncate rounded-l-none border-gray-300 font-normal shadow-none"
        />
      </div>
    </div>
  );
}
