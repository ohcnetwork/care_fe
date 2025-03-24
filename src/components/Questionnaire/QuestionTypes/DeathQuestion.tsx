import { DateTimePicker } from "@/components/ui/date-time-picker";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface TimeOfDeathQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors: QuestionValidationError[];
}

export function TimeOfDeathQuestion(props: TimeOfDeathQuestionProps) {
  const { questionnaireResponse, updateQuestionnaireResponseCB } = props;

  const values = (questionnaireResponse.values?.[0]?.value as string) || [];

  const handleUpdate = (updates: string) => {
    updateQuestionnaireResponseCB(
      [
        {
          type: "time_of_death",
          value: [updates],
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <DateTimePicker
      value={values[0] ? new Date(values[0]) : undefined}
      onChange={(value) => handleUpdate(value?.toISOString() || "")}
      disabled={props.disabled}
    />
  );
}
