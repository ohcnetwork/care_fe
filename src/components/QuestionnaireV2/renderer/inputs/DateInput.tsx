import "react-day-picker/style.css";

import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

export function DateInput({
  question,
  disabled,
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
    <CombinedDatePicker
      value={value}
      onChange={handleChange}
      disabled={disabled}
      buttonClassName="border-gray-300 shadow-none"
    />
  );
}
