import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface BooleanQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
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
  return (
    <RadioGroup
      value={questionnaireResponse.values[0]?.value?.toString()}
      onValueChange={(value) => {
        clearError();
        updateQuestionnaireResponseCB({
          ...questionnaireResponse,
          values: [
            {
              type: "boolean",
              value: value === "true",
            },
          ],
        });
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
            True
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="false" id={`${question.id}-false`} />
          <Label
            htmlFor={`${question.id}-false`}
            className="text-sm font-normal"
          >
            False
          </Label>
        </div>
      </div>
    </RadioGroup>
  );
}
