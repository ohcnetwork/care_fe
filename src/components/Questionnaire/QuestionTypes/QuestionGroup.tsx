import { memo } from "react";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { QuestionInput } from "./QuestionInput";

interface QuestionGroupProps {
  question: Question;
  encounterId?: string;
  questionnaireResponses: QuestionnaireResponse[];
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  facilityId: string;
}

export const QuestionGroup = memo(function QuestionGroup({
  question,
  encounterId,
  questionnaireResponses,
  updateQuestionnaireResponseCB,
  errors,
  clearError,
  disabled,
  activeGroupId,
  facilityId,
}: QuestionGroupProps) {
  if (question.type !== "group") {
    return (
      <QuestionInput
        question={question}
        questionnaireResponses={questionnaireResponses}
        encounterId={encounterId}
        updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
        errors={errors}
        clearError={() => clearError(question.id)}
        disabled={disabled}
        facilityId={facilityId}
      />
    );
  }

  const isActive = activeGroupId === question.id;

  return (
    <div className="pt-4">
      <div
        className={cn(
          "space-y-4 rounded-lg border p-4",
          isActive && "ring-2 ring-primary",
        )}
      >
        {question.text && (
          <div className="space-y-1">
            <Label className="text-lg font-semibold text-green-600">
              {question.text}
            </Label>
            {question.description && (
              <p className="text-sm text-muted-foreground">
                {question.description}
              </p>
            )}
          </div>
        )}
        <div
          className={cn(
            "gap-2",
            question.styling_metadata?.classes &&
              question.styling_metadata.classes,
          )}
        >
          {question.questions?.map((subQuestion) => (
            <QuestionGroup
              facilityId={facilityId}
              key={subQuestion.id}
              question={subQuestion}
              questionnaireResponses={questionnaireResponses}
              updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
              errors={errors}
              clearError={clearError}
              disabled={disabled}
              activeGroupId={activeGroupId}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
