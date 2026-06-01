import { Button } from "@/components/ui/button";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { EnableWhen, Question } from "@/types/questionnaire/question";

import { QuestionDescription } from "@/components/Questionnaire/QuestionDescription";
import { Plus, XIcon } from "lucide-react";
import { QuestionInput } from "./QuestionInput";

interface QuestionGroupProps {
  question: Question;
  encounterId?: string;
  questionnaireResponses: QuestionnaireResponse[];
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
    subResults?: QuestionnaireResponse[][],
  ) => void;
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  facilityId?: string;
  patientId: string;
  isSubQuestion?: boolean;
  questionnaireId?: string;
  questionnaireSlug?: string;
}

export function isQuestionEnabled(
  question: Question,
  questionnaireResponses: QuestionnaireResponse[],
) {
  if (!question.enable_when?.length) return true;

  const checkCondition = (enableWhen: EnableWhen) => {
    const dependentValues = questionnaireResponses.find(
      (v) => v.link_id === enableWhen.question,
    )?.values;

    if (!dependentValues || dependentValues.length === 0) return false;

    function normalizeValue(value: unknown): unknown {
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "number") return value.toString();
      return value;
    }

    const normalizedAnswers = dependentValues.map((v) =>
      normalizeValue(v.value),
    );

    switch (enableWhen.operator) {
      case "exists":
        return (
          normalizedAnswers.length > 0 &&
          normalizedAnswers.some(
            (v) => v !== "" && v !== null && v !== undefined,
          )
        );

      case "equals":
        return normalizedAnswers.includes(enableWhen.answer);

      case "not_equals":
        return !normalizedAnswers.includes(enableWhen.answer);

      case "greater":
        return normalizedAnswers.some(
          (v) => !isNaN(Number(v)) && Number(v) > enableWhen.answer,
        );

      case "less":
        return normalizedAnswers.some(
          (v) => !isNaN(Number(v)) && Number(v) < enableWhen.answer,
        );

      case "greater_or_equals":
        return normalizedAnswers.some(
          (v) => !isNaN(Number(v)) && Number(v) >= enableWhen.answer,
        );

      case "less_or_equals":
        return normalizedAnswers.some(
          (v) => !isNaN(Number(v)) && Number(v) <= enableWhen.answer,
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
  questionnaireId,
  questionnaireSlug,
}: QuestionGroupProps) {
  const isEnabled = isQuestionEnabled(question, questionnaireResponses);

  const clearDependentQuestionResponse = (dependentQuestion: Question) => {
    const dependentQuestionResponse = questionnaireResponses.find(
      (v) => v.question_id === dependentQuestion.id,
    );
    if (dependentQuestionResponse) {
      updateQuestionnaireResponseCB([], dependentQuestion.id);
    }
    dependentQuestion.questions?.forEach((q) => {
      clearDependentQuestionResponse(q);
    });
  };

  useEffect(() => {
    if (!isEnabled) {
      clearDependentQuestionResponse(question);
    }
  }, [isEnabled]);

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
        questionnaireId={questionnaireId}
        questionnaireSlug={questionnaireSlug}
      />
    );
  }

  if (question.repeats) {
    return (
      <RepeatableGroupRenderer
        question={question}
        encounterId={encounterId}
        questionnaireResponses={questionnaireResponses}
        updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
        errors={errors}
        clearError={clearError}
        disabled={disabled}
        activeGroupId={activeGroupId}
        facilityId={facilityId}
        patientId={patientId}
        isSubQuestion={isSubQuestion}
        questionnaireId={questionnaireId}
        questionnaireSlug={questionnaireSlug}
      />
    );
  }

  const isActive = activeGroupId === question.id;

  return (
    <div
      className={cn(
        "sm:rounded-lg bg-gray-100 md:bg-transparent",
        isActive && "ring-2 ring-primary",
        question.styling_metadata?.classes && question.styling_metadata.classes,
      )}
    >
      {question.text && (
        <div className="px-2 pt-2 bg-gray-100 md:bg-transparent">
          <QuestionLabel
            question={question}
            groupLabel
            isSubQuestion={isSubQuestion}
          />
          <QuestionDescription question={question} />
        </div>
      )}
      <div
        className={cn(
          "gap-1",
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
            questionnaireId={questionnaireId}
            questionnaireSlug={questionnaireSlug}
          />
        ))}
      </div>
    </div>
  );
});

function initializeGroupResponses(
  questions: Question[],
): QuestionnaireResponse[] {
  const responses: QuestionnaireResponse[] = [];
  for (const q of questions) {
    if (q.type === "group" && q.questions) {
      if (q.repeats) {
        responses.push({
          question_id: q.id,
          link_id: q.link_id,
          values: [],
          structured_type: null,
          sub_results: [initializeGroupResponses(q.questions)],
        });
      } else {
        responses.push(...initializeGroupResponses(q.questions));
      }
    } else {
      responses.push({
        question_id: q.id,
        link_id: q.link_id,
        values: [],
        structured_type: q.structured_type ?? null,
      });
    }
  }
  return responses;
}

function RepeatableGroupRenderer({
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
  isSubQuestion,
  questionnaireId,
  questionnaireSlug,
}: QuestionGroupProps) {
  const { t } = useTranslation();

  const groupResponse = questionnaireResponses.find(
    (r) => r.question_id === question.id,
  );
  const subResults = groupResponse?.sub_results ?? [];

  const handleAddInstance = () => {
    const newInstance = initializeGroupResponses(question.questions ?? []);
    const updatedSubResults = [...subResults, newInstance];
    updateQuestionnaireResponseCB(
      [],
      question.id,
      undefined,
      updatedSubResults,
    );
  };

  const handleRemoveInstance = (index: number) => {
    const updatedSubResults = subResults.filter((_, i) => i !== index);
    updateQuestionnaireResponseCB(
      [],
      question.id,
      undefined,
      updatedSubResults,
    );
  };

  const handleUpdateSubResponse = (
    instanceIndex: number,
    values: ResponseValue[],
    questionId: string,
    note?: string,
    nestedSubResults?: QuestionnaireResponse[][],
  ) => {
    const updatedSubResults = subResults.map((instance, i) => {
      if (i !== instanceIndex) return instance;
      return instance.map((r) =>
        r.question_id === questionId
          ? {
              ...r,
              values,
              ...(note !== undefined ? { note } : {}),
              ...(nestedSubResults !== undefined
                ? { sub_results: nestedSubResults }
                : {}),
            }
          : r,
      );
    });
    updateQuestionnaireResponseCB(
      [],
      question.id,
      undefined,
      updatedSubResults,
    );
  };

  const isActive = activeGroupId === question.id;

  return (
    <div
      className={cn(
        "sm:rounded-lg bg-gray-100 md:bg-transparent",
        isActive && "ring-2 ring-primary",
        question.styling_metadata?.classes && question.styling_metadata.classes,
      )}
    >
      {question.text && (
        <div className="px-2 pt-2 bg-gray-100 md:bg-transparent">
          <QuestionLabel
            question={question}
            groupLabel
            isSubQuestion={isSubQuestion}
          />
          <QuestionDescription question={question} />
        </div>
      )}
      <div className="space-y-4 p-2">
        {subResults.map((instance, instanceIndex) => (
          <div
            key={instanceIndex}
            className="relative rounded-md border border-gray-200 bg-white p-3"
          >
            {subResults.length > 1 && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  #{instanceIndex + 1}
                </span>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstance(instanceIndex)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </div>
            )}
            <div
              className={cn(
                "gap-1",
                question.styling_metadata?.containerClasses &&
                  question.styling_metadata.containerClasses,
              )}
            >
              {question.questions?.map((subQuestion) => (
                <QuestionGroup
                  encounterId={encounterId}
                  facilityId={facilityId}
                  key={`${subQuestion.id}-${instanceIndex}`}
                  question={subQuestion}
                  questionnaireResponses={instance}
                  updateQuestionnaireResponseCB={(
                    values,
                    questionId,
                    note,
                    subResults,
                  ) =>
                    handleUpdateSubResponse(
                      instanceIndex,
                      values,
                      questionId,
                      note,
                      subResults,
                    )
                  }
                  errors={errors}
                  clearError={clearError}
                  disabled={disabled}
                  activeGroupId={activeGroupId}
                  patientId={patientId}
                  isSubQuestion={true}
                  questionnaireId={questionnaireId}
                  questionnaireSlug={questionnaireSlug}
                />
              ))}
            </div>
          </div>
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddInstance}
            className={cn(
              isSubQuestion ? "text-gray-500 hover:text-gray-700" : "w-full",
            )}
          >
            <Plus className="size-4" />
            {isSubQuestion
              ? `${t("add_another")} ${question.text || ""}`
              : t("add_another")}
          </Button>
        )}
      </div>
    </div>
  );
}
