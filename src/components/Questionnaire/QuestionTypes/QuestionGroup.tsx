import { Button } from "@/components/ui/button";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
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
import { initializeGroupResponses } from "@/components/Questionnaire/utils";
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

  const questionnaireResponsesRef = useRef(questionnaireResponses);
  questionnaireResponsesRef.current = questionnaireResponses;

  const clearDependentQuestionResponse = useCallback(
    (dependentQuestion: Question) => {
      const dependentQuestionResponse = questionnaireResponsesRef.current.find(
        (v) => v.question_id === dependentQuestion.id,
      );
      if (dependentQuestionResponse) {
        // For repeatable groups, explicitly clear sub_results to reset instances
        if (dependentQuestion.repeats) {
          updateQuestionnaireResponseCB(
            [],
            dependentQuestion.id,
            undefined,
            [],
          );
        } else {
          updateQuestionnaireResponseCB([], dependentQuestion.id);
        }
      }
      dependentQuestion.questions?.forEach((q) => {
        clearDependentQuestionResponse(q);
      });
    },
    [updateQuestionnaireResponseCB],
  );

  const prevIsEnabledRef = useRef(isEnabled);
  useEffect(() => {
    if (prevIsEnabledRef.current && !isEnabled) {
      clearDependentQuestionResponse(question);
    }
    prevIsEnabledRef.current = isEnabled;
  }, [isEnabled, clearDependentQuestionResponse, question]);

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
      id={"question-" + question.id}
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

let instanceIdCounter = 0;

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

  // Stable instance keys: maintain a ref that maps each instance to a unique ID
  const instanceKeysRef = useRef<number[]>([]);
  if (instanceKeysRef.current.length < subResults.length) {
    // New instances were added — assign new keys for the new ones
    while (instanceKeysRef.current.length < subResults.length) {
      instanceKeysRef.current.push(++instanceIdCounter);
    }
  } else if (instanceKeysRef.current.length > subResults.length) {
    // Instances were removed — trim to match (handled by handleRemoveInstance)
    instanceKeysRef.current = instanceKeysRef.current.slice(
      0,
      subResults.length,
    );
  }

  // Use a ref to hold subResults for stable callback references
  const subResultsRef = useRef(subResults);
  subResultsRef.current = subResults;

  const handleAddInstance = useCallback(() => {
    const newInstance = initializeGroupResponses(question.questions ?? []);
    const updatedSubResults = [...subResultsRef.current, newInstance];
    updateQuestionnaireResponseCB(
      [],
      question.id,
      undefined,
      updatedSubResults,
    );
  }, [question.questions, question.id, updateQuestionnaireResponseCB]);

  const handleRemoveInstance = useCallback(
    (index: number) => {
      const updatedSubResults = subResultsRef.current.filter(
        (_, i) => i !== index,
      );
      // Also remove the corresponding stable key
      instanceKeysRef.current = instanceKeysRef.current.filter(
        (_, i) => i !== index,
      );
      updateQuestionnaireResponseCB(
        [],
        question.id,
        undefined,
        updatedSubResults,
      );
    },
    [question.id, updateQuestionnaireResponseCB],
  );

  const handleUpdateSubResponse = useCallback(
    (
      instanceIndex: number,
      values: ResponseValue[],
      questionId: string,
      note?: string,
      nestedSubResults?: QuestionnaireResponse[][],
    ) => {
      const updatedSubResults = subResultsRef.current.map((instance, i) => {
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
    },
    [question.id, updateQuestionnaireResponseCB],
  );

  const isActive = activeGroupId === question.id;

  return (
    <div
      id={"question-" + question.id}
      className={cn(
        "sm:rounded-lg bg-gray-100 md:bg-transparent",
        isActive && "ring-2 ring-primary",
        question.styling_metadata?.classes,
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
          <RepeatableGroupInstance
            key={instanceKeysRef.current[instanceIndex]}
            instance={instance}
            instanceIndex={instanceIndex}
            instanceCount={subResults.length}
            question={question}
            encounterId={encounterId}
            questionnaireResponses={questionnaireResponses}
            errors={errors}
            clearError={clearError}
            disabled={disabled}
            activeGroupId={activeGroupId}
            facilityId={facilityId}
            patientId={patientId}
            questionnaireId={questionnaireId}
            questionnaireSlug={questionnaireSlug}
            onRemove={handleRemoveInstance}
            onUpdateSubResponse={handleUpdateSubResponse}
          />
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

interface RepeatableGroupInstanceProps {
  instance: QuestionnaireResponse[];
  instanceIndex: number;
  instanceCount: number;
  question: Question;
  encounterId?: string;
  questionnaireResponses: QuestionnaireResponse[];
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  facilityId?: string;
  patientId: string;
  questionnaireId?: string;
  questionnaireSlug?: string;
  onRemove: (index: number) => void;
  onUpdateSubResponse: (
    instanceIndex: number,
    values: ResponseValue[],
    questionId: string,
    note?: string,
    nestedSubResults?: QuestionnaireResponse[][],
  ) => void;
}

const RepeatableGroupInstance = memo(function RepeatableGroupInstance({
  instance,
  instanceIndex,
  instanceCount,
  question,
  encounterId,
  questionnaireResponses,
  errors,
  clearError,
  disabled,
  activeGroupId,
  facilityId,
  patientId,
  questionnaireId,
  questionnaireSlug,
  onRemove,
  onUpdateSubResponse,
}: RepeatableGroupInstanceProps) {
  const { t } = useTranslation();

  // Scope errors to this instance: only pass errors matching this index or with no index
  const instanceErrors = useMemo(
    () =>
      errors.filter((e) => e.index === undefined || e.index === instanceIndex),
    [errors, instanceIndex],
  );

  const mergedResponses = useMemo(
    () => [...instance, ...questionnaireResponses],
    [instance, questionnaireResponses],
  );

  return (
    <div className="relative rounded-md border border-gray-200 bg-white p-3">
      {instanceCount > 1 && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            #{instanceIndex + 1}
          </span>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(instanceIndex)}
              className="size-6 text-gray-400 hover:text-red-500"
              aria-label={t("remove")}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
      )}
      <div className={cn("gap-1", question.styling_metadata?.containerClasses)}>
        {question.questions?.map((subQuestion) => (
          <QuestionGroup
            encounterId={encounterId}
            facilityId={facilityId}
            key={`${subQuestion.id}-${instanceIndex}`}
            question={subQuestion}
            questionnaireResponses={mergedResponses}
            updateQuestionnaireResponseCB={(
              values,
              questionId,
              note,
              subResults,
            ) =>
              onUpdateSubResponse(
                instanceIndex,
                values,
                questionId,
                note,
                subResults,
              )
            }
            errors={instanceErrors}
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
