import { t } from "i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
  disableRightBorder?: boolean;
  index: number;
}

export function DateTimeQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  disableRightBorder,
  index,
}: DateTimeQuestionProps) {
  const currentValue = questionnaireResponse.values[index]?.value
    ? new Date(questionnaireResponse.values[index].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    clearError();
    if (date && currentValue) {
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

  const showClear = currentValue && !disabled;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <DatePicker
        date={currentValue}
        onChange={handleSelect}
        disablePicker={disabled}
        className="flex-1 border-gray-300"
      />
      <div className="flex sm:w-[186px]">
        <Input
          type="time"
          className={cn(
            "flex-1 min-w-0 border-gray-300 h-9 text-sm sm:text-base shadow",
            (showClear || disableRightBorder) && "rounded-r-none border-r-0",
          )}
          value={formatTime(currentValue)}
          onChange={handleTimeChange}
          disabled={disabled || !currentValue}
        />
        {showClear && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleSelect(undefined)}
            aria-label={t("clear")}
            title={t("clear")}
            className={cn(
              "rounded-l-none border-gray-300",
              disableRightBorder ? "rounded-r-none border-r-0" : "rounded-r-md",
            )}
          >
            <CareIcon icon="l-times" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
