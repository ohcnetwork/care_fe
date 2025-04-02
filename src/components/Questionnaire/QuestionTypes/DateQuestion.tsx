import "react-day-picker/style.css";

import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface DateQuestionProps {
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

export function DateQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
}: DateQuestionProps) {
  const currentValue = questionnaireResponse.values[0]?.value
    ? new Date(questionnaireResponse.values[0].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    clearError();
    updateQuestionnaireResponseCB(
      [
        {
          type: "dateTime",
          value: date,
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <CombinedDatePicker
      value={currentValue}
      onChange={handleSelect}
      disabled={disabled}
      classes={classes}
    />
  );
}
