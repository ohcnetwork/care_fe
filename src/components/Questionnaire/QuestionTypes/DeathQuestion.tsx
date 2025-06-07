import { format } from "date-fns";

import { DateTimeInput } from "@/components/Common/DateTimeInput";

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
}

export function TimeOfDeathQuestion(props: TimeOfDeathQuestionProps) {
  const { questionnaireResponse, updateQuestionnaireResponseCB } = props;

  const values = (questionnaireResponse.values?.[0]?.value as string[]) || [];

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
    <DateTimeInput
      value={values[0]}
      onDateChange={(val) => handleUpdate(val)}
      max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
      disabled={props.disabled}
    />
  );
}
