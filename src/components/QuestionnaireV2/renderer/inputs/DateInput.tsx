import "react-day-picker/style.css";

import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function DateInput({ question, disabled }: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value (e.g. a
  // seeded string from answer_option) renders empty instead of crashing.
  const first = response?.values[0];
  const value = first?.type === "date" ? first.value : undefined;

  const handleChange = (date: Date | undefined) => {
    if (!date) return;
    updateResponse({ values: [{ type: "date", value: date }] });
  };

  return (
    <CombinedDatePicker
      value={value}
      onChange={handleChange}
      disabled={disabled}
      buttonClassName="border-r-0 rounded-r-none border-gray-300 shadow-none"
    />
  );
}
