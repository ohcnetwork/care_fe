import "react-day-picker/style.css";

import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function DateInput({ question, disabled }: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  const value = response?.values[0]?.value as Date | undefined;

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
