import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface BooleanQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
}

export function BooleanQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
}: BooleanQuestionProps) {
  const { t } = useTranslation();

  return (
    <RadioGroup
      value={questionnaireResponse.values[0]?.value?.toString()}
      onValueChange={(value) => {
        clearError();
        updateQuestionnaireResponseCB(
          [
            {
              type: "boolean",
              value: value === "true",
            },
          ],
          questionnaireResponse.question_id,
          questionnaireResponse.note,
        );
      }}
      disabled={disabled}
    >
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="true" id={`${question.id}-true`} />
          <Label
            htmlFor={`${question.id}-true`}
            className="text-sm font-normal"
          >
            {t("yes")}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="false" id={`${question.id}-false`} />
          <Label
            htmlFor={`${question.id}-false`}
            className="text-sm font-normal"
          >
            {t("no")}
          </Label>
        </div>
      </div>
    </RadioGroup>
  );
}
