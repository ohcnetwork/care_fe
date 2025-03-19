import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface FilesQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors: QuestionValidationError[];
  encounterId: string;
  facilityId: string;
}

export function FilesQuestion(props: FilesQuestionProps) {
  const {
    question,
    questionnaireResponse,
    updateQuestionnaireResponseCB,
    disabled,
    errors,
    encounterId,
    facilityId,
  } = props;

  return <div className="space-y-4">FILE QUESTION</div>;
}
