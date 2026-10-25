import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { QuestionInputGroup } from "./QuestionInputGroup";
import { replaceEntryAt } from "./withEntryAt";

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
  labelId,
  errorId,
  valueIndex,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "dateTime" ? entry.value : undefined;

  const writeValue = (date: Date) => {
    updateResponse({
      values: replaceEntryAt(response?.values, valueIndex, {
        type: "dateTime",
        value: date,
      }),
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      updateResponse({
        values: replaceEntryAt(
          response?.values,
          valueIndex,
          { type: "dateTime", value: undefined },
          true,
        ),
      });
      return;
    }
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours());
      next.setMinutes(value.getMinutes());
    }
    writeValue(next);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const next = value ? new Date(value) : new Date();
    next.setHours(hours);
    next.setMinutes(minutes);

    writeValue(next);
  };

  return (
    <QuestionInputGroup
      labelId={labelId}
      required={question.required}
      errorId={errorId}
      className="flex flex-col sm:flex-row gap-2"
    >
      <DatePicker
        date={value}
        onChange={handleDateChange}
        disablePicker={disabled}
        className="flex-1 border-gray-300 shadow-none"
      />
      <Input
        type="time"
        aria-labelledby={labelId}
        aria-describedby={errorId}
        aria-invalid={!!errorId || undefined}
        className="h-9 sm:w-[150px]"
        value={formatTime(value)}
        onChange={handleTimeChange}
        disabled={disabled || !value}
      />
    </QuestionInputGroup>
  );
}
