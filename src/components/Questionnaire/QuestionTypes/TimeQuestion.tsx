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
}

export function TimeQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
}: TimeQuestionProps) {
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":");

    clearError();
    updateQuestionnaireResponseCB(
      [
        {
          type: "time",
          value: `${hours}:${minutes}:00`,
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <Input
      type="time"
      value={
        questionnaireResponse.values[0]?.value
          ? (questionnaireResponse.values[0].value as string).slice(0, 5)
          : ""
      }
      className={cn(classes)}
      onChange={handleTimeChange}
      disabled={disabled}
    />
  );
}
