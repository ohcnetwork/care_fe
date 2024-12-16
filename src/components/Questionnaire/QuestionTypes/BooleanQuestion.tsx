import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={question.id}
          checked={questionnaireResponse.values[0]?.value === true}
          onCheckedChange={(checked) => {
            clearError();
            updateQuestionnaireResponseCB({
              ...questionnaireResponse,
              values: [
                {
                  type: "boolean",
                  value: checked,
                },
              ],
            });
          }}
          disabled={disabled}
        />
        <Label htmlFor={question.id} className="text-sm font-normal">
          {question.text}
          {question.required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      </div>
    </div>
  );
}
