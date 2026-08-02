import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

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
  valueIndex,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value (e.g. a
  // seeded string from answer_option) would otherwise reach formatTime and
  // crash on date.getHours() during render.
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "dateTime" ? entry.value : undefined;

  const writeValue = (date: Date) => {
    if (valueIndex === undefined) {
      updateResponse({ values: [{ type: "dateTime", value: date }] });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, {
        type: "dateTime",
        value: date,
      }),
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    if (value) {
      date.setHours(value.getHours());
      date.setMinutes(value.getMinutes());
    }
    writeValue(date);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const date = value || new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    writeValue(date);
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
        className="h-9 text-sm sm:w-[150px] sm:text-base"
        value={formatTime(value)}
        onChange={handleTimeChange}
        disabled={disabled || !value}
      />
    </div>
  );
}
