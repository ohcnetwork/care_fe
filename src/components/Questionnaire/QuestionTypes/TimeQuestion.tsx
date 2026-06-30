import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface TimeQuestionProps {
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

export function TimeQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
  disableRightBorder,
  index,
}: TimeQuestionProps) {
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = event.target.value;

    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "time",
      value: time === "" ? undefined : `${time}:00`,
    };

    clearError();
    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <Input
      type="time"
      value={
        questionnaireResponse.values[index]?.value
          ? (questionnaireResponse.values[index].value as string).slice(0, 5)
          : ""
      }
      className={cn(
        classes,
        "h-9 text-sm sm:text-base",
        disableRightBorder && "rounded-r-none border-r-0 shadow-none",
      )}
      onChange={handleTimeChange}
      disabled={disabled}
    />
  );
}
