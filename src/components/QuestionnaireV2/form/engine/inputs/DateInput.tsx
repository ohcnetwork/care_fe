import "react-day-picker/style.css";

import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { withEntryAt } from "./withEntryAt";

export function DateInput({
  question,
  disabled,
  labelId,
  valueIndex,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value (e.g. a
  // seeded string from answer_option) renders empty instead of crashing.
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "date" ? entry.value : undefined;

  const handleChange = (date: Date | undefined) => {
    if (!date) return;
    if (valueIndex === undefined) {
      updateResponse({ values: [{ type: "date", value: date }] });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, {
        type: "date",
        value: date,
      }),
    });
  };

  return (
    // The picker's trigger button takes no id/aria props (ui/ primitives
    // stay unmodified), so the question association rides on a named
    // group — without it every date question announces as an identical
    // bare "Pick a date" stop.
    <div
      role="group"
      aria-labelledby={labelId}
      aria-required={question.required || undefined}
    >
      <CombinedDatePicker
        value={value}
        onChange={handleChange}
        disabled={disabled}
        buttonClassName="border-gray-300 shadow-none"
      />
    </div>
  );
}
