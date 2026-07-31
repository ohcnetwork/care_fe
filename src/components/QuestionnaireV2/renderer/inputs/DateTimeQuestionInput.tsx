import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

function formatTime(date: Date | undefined) {
  if (!date) return "";
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export function DateTimeQuestionInput({
  question,
  disabled,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  const value = response?.values[0]?.value as Date | undefined;

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    if (value) {
      date.setHours(value.getHours());
      date.setMinutes(value.getMinutes());
    }
    updateResponse({ values: [{ type: "dateTime", value: date }] });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const date = value || new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    updateResponse({ values: [{ type: "dateTime", value: date }] });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <DatePicker
        date={value}
        onChange={handleDateChange}
        disablePicker={disabled}
        className="flex-1 border-gray-300 shadow-none"
      />
      <Input
        type="time"
        className="sm:w-[150px] sm:border-r-0 sm:ring-r-0 sm:focus-visible:ring-0 h-9 text-sm sm:text-base"
        value={formatTime(value)}
        onChange={handleTimeChange}
        disabled={disabled || !value}
      />
    </div>
  );
}
