import { t } from "i18next";
import { memo, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

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
    groupInstanceId?: string,
    structured_type?: QuestionnaireResponse["structured_type"],
    link_id?: string,
    note?: string,
  ) => void;
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  facilityId?: string;
  patientId: string;
  isSubQuestion?: boolean;
  groupInstanceId?: string;
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
  groupInstanceId,
}: QuestionGroupProps) {
  const [groupInstances, setGroupInstances] = useState(() => {
    return [questionnaireResponses[0].group_instance_id];
  });
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
        groupInstanceId={groupInstanceId}
      />
    );
  }

  function handleOnClick(): void {
    const id = crypto.randomUUID();
    setGroupInstances((prev) => [...prev, id]);
    question.questions?.forEach((q) => {
      updateQuestionnaireResponseCB(
        [],
        q.id,
        id,
        q.structured_type ?? null,
        q.link_id,
      );
    });
  }

  const isActive = activeGroupId === question.id;

  return (
    <div
      data-cy="group_styling"
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
          {question.description && (
            <p className="text-sm text-gray-500">{question.description}</p>
          )}
        </div>
      )}
      <div
        data-cy="group_container_styling"
        className={cn(
          "gap-1",
          question.styling_metadata?.containerClasses &&
            question.styling_metadata.containerClasses,
        )}
      >
        {groupInstances.map((instanceId) => {
          console.log("questionnaireResponses", questionnaireResponses);
          const instanceResponses = questionnaireResponses.filter(
            (res) => res.group_instance_id === instanceId,
          );
          console.log("instanceResponses", instanceResponses);
          return (
            <div
              key={instanceId}
              className="border p-2 mb-2 rounded-md bg-white"
            >
              {question.questions?.map((subQuestion) => (
                <QuestionGroup
                  key={`${subQuestion.id}-${instanceId}`}
                  question={subQuestion}
                  questionnaireResponses={instanceResponses}
                  updateQuestionnaireResponseCB={(
                    values: ResponseValue[],
                    questionId: string,
                    groupInstanceId?: string,
                    structured_type?: QuestionnaireResponse["structured_type"],
                    link_id?: string,
                    note?: string,
                  ) =>
                    updateQuestionnaireResponseCB(
                      values,
                      questionId,
                      instanceId,
                      structured_type,
                      link_id,
                      note,
                    )
                  }
                  groupInstanceId={instanceId}
                  encounterId={encounterId}
                  errors={errors}
                  clearError={clearError}
                  disabled={disabled}
                  activeGroupId={activeGroupId}
                  facilityId={facilityId}
                  patientId={patientId}
                  isSubQuestion={true}
                />
              ))}
            </div>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOnClick}
        className=""
        disabled={disabled}
      >
        <CareIcon icon="l-plus" className="mr-2 size-4" />
        {t("add_another")}
      </Button>
    </div>
  );
});
