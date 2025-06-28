import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

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
}: QuestionGroupProps) {
  const { t } = useTranslation();
  const [groupInstances, setGroupInstances] = useState(() => {
    return [crypto.randomUUID()];
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
      />
    );
  }

  function handleOnClick(): void {
    const id = crypto.randomUUID();
    questionnaireResponses.forEach((res) => {
      const newValues = [...res.values];
      newValues.push({ type: "string", value: "", instance_id: id });
      updateQuestionnaireResponseCB(newValues, res.question_id);
    });

    setGroupInstances((prev) => [...prev, id]);
  }

  const isActive = activeGroupId === question.id;

  function removeValue(instance_id: string | undefined): void {
    if (groupInstances.length <= 1) return; // Don't remove the last instance

    setGroupInstances((prev) => prev.filter((inst) => inst !== instance_id));

    question.questions?.forEach((q) => {
      const existingValues =
        questionnaireResponses.find((res) => res.question_id === q.id)
          ?.values || [];
      const values = existingValues.filter((v) => v.instance_id != instance_id);
      updateQuestionnaireResponseCB(values, q.id);
    });
  }

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
          const instanceResponses: QuestionnaireResponse[] =
            questionnaireResponses.map((res) => ({
              ...res,
              values: res.values.filter(
                (val) => val.instance_id === instanceId,
              ),
            }));

          return (
            <div
              key={instanceId}
              className="border p-2 mb-2 rounded-md bg-white relative"
            >
              {groupInstances.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeValue(instanceId)}
                  className="size-8 absolute top-1 right-1"
                  disabled={disabled}
                >
                  <CareIcon icon="l-trash" className="size-4" />
                </Button>
              )}
              {question.questions?.map((subQuestion) => (
                <QuestionGroup
                  key={`${subQuestion.id}-${instanceId}`}
                  question={subQuestion}
                  questionnaireResponses={instanceResponses}
                  updateQuestionnaireResponseCB={(
                    values: ResponseValue[],
                    questionId: string,
                    note?: string,
                  ) => {
                    const existingValues =
                      questionnaireResponses.find(
                        (res) => res.question_id === subQuestion.id,
                      )?.values || [];
                    const valuesWithInstanceId = values.map((value) => ({
                      ...value,
                      instance_id: instanceId,
                    }));

                    // Merge existing values with new values, replacing values for the current instance
                    const mergedValues = existingValues.map((existingValue) =>
                      existingValue.instance_id === instanceId
                        ? valuesWithInstanceId[0] || existingValue
                        : existingValue,
                    );

                    // If no existing value for this instance, add the new values
                    const hasInstanceValue = existingValues.some(
                      (v) => v.instance_id === instanceId,
                    );
                    const finalValues = hasInstanceValue
                      ? mergedValues
                      : [...existingValues, ...valuesWithInstanceId];

                    updateQuestionnaireResponseCB(
                      finalValues,
                      questionId,
                      note,
                    );
                  }}
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
