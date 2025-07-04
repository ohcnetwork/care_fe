import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface DateTimeQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  classes?: string;
  index: number;
}

export function DateTimeQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  index,
}: DateTimeQuestionProps) {
  const currentValue = questionnaireResponse.values[index]?.value
    ? new Date(questionnaireResponse.values[index].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    clearError();
    if (currentValue) {
      date.setHours(currentValue.getHours());
      date.setMinutes(currentValue.getMinutes());
    }

    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "dateTime",
      value: date,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const date = currentValue || new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "dateTime",
      value: date,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return "";
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex sm:gap-2 flex-wrap">
      <DatePicker date={currentValue} onChange={handleSelect} />
      <Input
        type="time"
        className="sm:w-[150px] border-t-0 sm:border-t border-gray-200"
        value={formatTime(currentValue)}
        onChange={handleTimeChange}
        disabled={disabled || !currentValue}
      />
    </div>
  );
}
