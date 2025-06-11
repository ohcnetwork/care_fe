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
  index: number;
}

export function DateQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
  index,
}: DateQuestionProps) {
  const currentValue = questionnaireResponse.values[index]?.value
    ? new Date(questionnaireResponse.values[index].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    clearError();
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

  return (
    <CombinedDatePicker
      value={currentValue}
      onChange={handleSelect}
      disabled={disabled}
      classes={classes}
    />
  );
}
