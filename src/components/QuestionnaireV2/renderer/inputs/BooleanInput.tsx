import { useTranslation } from "react-i18next";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

export function BooleanInput({
  question,
  disabled,
  labelId,
  valueIndex,
}: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value (e.g. a
  // seeded string from answer_option) renders unanswered instead of crashing.
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "boolean" ? entry.value : undefined;

  const handleChange = (next: boolean) => {
    if (valueIndex === undefined) {
      updateResponse({ values: [{ type: "boolean", value: next }] });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, {
        type: "boolean",
        value: next,
      }),
    });
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className="flex flex-wrap gap-3"
    >
      <ChoiceChip
        control="radio"
        label={t("yes")}
        checked={value === true}
        disabled={disabled}
        onCheckedChange={() => handleChange(true)}
      />
      <ChoiceChip
        control="radio"
        label={t("no")}
        checked={value === false}
        disabled={disabled}
        onCheckedChange={() => handleChange(false)}
      />
    </div>
  );
}
