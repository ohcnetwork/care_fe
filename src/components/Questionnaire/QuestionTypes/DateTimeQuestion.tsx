import { format } from "date-fns";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface DateTimeQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
  clearError: () => void;
  classes?: string;
}

export function DateTimeQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
}: DateTimeQuestionProps) {
  const currentValue = questionnaireResponse.values[0]?.value
    ? new Date(questionnaireResponse.values[0].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      handleUpdate(undefined);
      return;
    }

    // Preserve the time if it exists, otherwise set to current time
    if (currentValue) {
      date.setHours(currentValue.getHours());
      date.setMinutes(currentValue.getMinutes());
    }
    handleUpdate(date);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeString = e.target.value;
    if (!timeString) return;

    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = currentValue ? new Date(currentValue) : new Date();
    newDate.setHours(hours);
    newDate.setMinutes(minutes);

    handleUpdate(newDate);
  };

  const handleUpdate = (date: Date | undefined) => {
    clearError();
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "dateTime",
          value: date?.toISOString() || "",
        },
      ],
    });
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return "";
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !currentValue && "text-muted-foreground",
                classes,
              )}
              disabled={disabled}
            >
              <CareIcon icon="l-calender" className="mr-2 h-4 w-4" />
              {currentValue ? format(currentValue, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentValue}
              onSelect={handleSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          className="w-[150px]"
          value={formatTime(currentValue)}
          onChange={handleTimeChange}
          disabled={disabled || !currentValue}
        />
      </div>
    </div>
  );
}
