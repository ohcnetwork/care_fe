import { memo } from "react";

import { cn } from "@/lib/utils";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { EnableWhen, Question } from "@/types/questionnaire/question";

import { QuestionInput } from "./QuestionInput";

interface QuestionGroupProps {
  question: Question;
  encounterId?: string;
  questionnaireResponses: QuestionnaireResponse[];
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  facilityId?: string;
  patientId: string;
  isSubQuestion?: boolean;
}

function isQuestionEnabled(
  question: Question,
  questionnaireResponses: QuestionnaireResponse[],
) {
  if (!question.enable_when?.length) return true;

  const checkCondition = (enableWhen: EnableWhen) => {
    const dependentValue = questionnaireResponses.find(
      (v) => v.link_id === enableWhen.question,
    )?.values[0];

    // Early return if no dependent value exists
    if (!dependentValue?.value) return false;

    switch (enableWhen.operator) {
      case "exists":
        return dependentValue !== undefined && dependentValue !== null;
      case "equals":
        return dependentValue.value === enableWhen.answer;
      case "not_equals":
        return dependentValue.value !== enableWhen.answer;
      case "greater":
        return (
          typeof dependentValue.value === "number" &&
          dependentValue.value > enableWhen.answer
        );
      case "less":
        return (
          typeof dependentValue.value === "number" &&
          dependentValue.value < enableWhen.answer
        );
      case "greater_or_equals":
        return (
          typeof dependentValue.value === "number" &&
          dependentValue.value >= enableWhen.answer
        );
      case "less_or_equals":
        return (
          typeof dependentValue.value === "number" &&
          dependentValue.value <= enableWhen.answer
        );
      default:
        return true;
    }
  };

  return question.enable_behavior === "any"
    ? question.enable_when.some(checkCondition)
    : question.enable_when.every(checkCondition);
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
  patientId,
  isSubQuestion = false,
}: QuestionGroupProps) {
  const isEnabled = isQuestionEnabled(question, questionnaireResponses);

  if (!isEnabled) {
    return null;
  }

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
        patientId={patientId}
        isSubQuestion={isSubQuestion}
      />
    );
  }

  const isActive = activeGroupId === question.id;

  return (
    <div
      data-cy="group_styling"
      className={cn(
        "sm:space-y-4 sm:rounded-lg",
        isActive && "ring-2 ring-primary",
        question.styling_metadata?.classes && question.styling_metadata.classes,
      )}
    >
      {question.text && (
        <div className="space-y-1 px-2 bg-gray-100 md:bg-transparent">
          <QuestionLabel
            question={question}
            groupLabel
            isSubQuestion={isSubQuestion}
          />
          {question.description && (
            <p className="text-sm text-gray-500">{question.description}</p>
          )}
        </div>
      )}
      <div
        data-cy="group_container_styling"
        className={cn(
          "gap-2",
          question.styling_metadata?.containerClasses &&
            question.styling_metadata.containerClasses,
        )}
      >
        {question.questions?.map((subQuestion) => (
          <QuestionGroup
            encounterId={encounterId}
            facilityId={facilityId}
            key={subQuestion.id}
            question={subQuestion}
            questionnaireResponses={questionnaireResponses}
            updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
            errors={errors}
            clearError={clearError}
            disabled={disabled}
            activeGroupId={activeGroupId}
            patientId={patientId}
            isSubQuestion={true}
          />
        ))}
      </div>
    </div>
  );
});
