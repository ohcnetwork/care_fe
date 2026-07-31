import { atom, useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { EnableWhen, Question } from "@/types/questionnaire/question";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

export const questionnaireAtom = atom<QuestionnaireRead | null>(null);
export const responsesAtom = atom<Record<string, QuestionnaireResponse>>({});
export const errorsAtom = atom<QuestionValidationError[]>([]);
export const activeGroupIndexAtom = atom(0);

/** link_id → question_id, for enable_when lookups. */
export const questionIdByLinkIdAtom = atom((get) => {
  const questionnaire = get(questionnaireAtom);
  const index: Record<string, string> = {};
  const walk = (questions: Question[]) => {
    for (const question of questions) {
      index[question.link_id] = question.id;
      if (question.questions) walk(question.questions);
    }
  };
  if (questionnaire) walk(questionnaire.questions);
  return index;
});

/** Flatten the tree into one response per non-group question, seeding
 *  initial_selected answer options (mirrors old initializeResponses). */
export function initializeResponses(
  questions: Question[],
): Record<string, QuestionnaireResponse> {
  const responses: Record<string, QuestionnaireResponse> = {};
  const walk = (qs: Question[]) => {
    for (const question of qs) {
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      const initial: ResponseValue[] =
        question.answer_option && question.answer_option.length > 0
          ? question.answer_option
              .filter((option) => option.initial_selected)
              .map((option) => ({
                type: "string" as const,
                value: option.value,
                coding: option.code ?? undefined,
              }))
          : [];
      responses[question.id] = {
        question_id: question.id,
        structured_type: question.structured_type ?? null,
        link_id: question.link_id,
        values: initial,
      };
    }
  };
  walk(questions);
  return responses;
}

/** Mirrors QuestionGroup.isQuestionEnabled's `normalizeValue` (old system):
 *  booleans normalize to "Yes"/"No", numbers stringify, before ANY operator
 *  is applied — matching the old code's unconditional normalization pass. */
function normalizeValue(value: unknown): unknown {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  return value;
}

/** Direct port of QuestionGroup.isQuestionEnabled's `checkCondition`
 *  (src/components/Questionnaire/QuestionTypes/QuestionGroup.tsx:37-103),
 *  operating on (enableWhen, response) instead of
 *  (enableWhen, questionnaireResponses). Preserves faithfully:
 *  - the unanswered-dependency short-circuit (no recorded values → false,
 *    for every operator, before any comparison runs)
 *  - evaluating against ALL of the dependent question's values (not just
 *    the first), via `.some()` / `.includes()` over the normalized values
 *  - normalizeValue being applied unconditionally before every operator */
export function evaluateEnableWhen(
  enableWhen: EnableWhen,
  response: QuestionnaireResponse | undefined,
): boolean {
  const dependentValues = response?.values;

  if (!dependentValues || dependentValues.length === 0) return false;

  const normalizedAnswers = dependentValues.map((v) => normalizeValue(v.value));

  switch (enableWhen.operator) {
    case "exists":
      return (
        normalizedAnswers.length > 0 &&
        normalizedAnswers.some((v) => v !== "" && v !== null && v !== undefined)
      );

    case "equals":
      // enableWhen.answer is boolean | string here (EnableWhenBoolean | EnableWhenString)
      return normalizedAnswers.includes(enableWhen.answer);

    case "not_equals":
      // enableWhen.answer is boolean | string here (EnableWhenBoolean | EnableWhenString)
      return !normalizedAnswers.includes(enableWhen.answer);

    case "greater":
      // enableWhen.answer is number here (EnableWhenNumeric)
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
}

export function useQuestionResponse(questionId: string) {
  const responseAtom = useMemo(
    () =>
      atom(
        (get) => get(responsesAtom)[questionId],
        (get, set, update: Partial<QuestionnaireResponse>) => {
          const previous = get(responsesAtom);
          const current = previous[questionId];
          if (!current) return;
          set(responsesAtom, {
            ...previous,
            [questionId]: { ...current, ...update },
          });
        },
      ),
    [questionId],
  );
  return useAtom(responseAtom);
}

export function useQuestionEnabled(question: Question): boolean {
  const enabledAtom = useMemo(
    () =>
      atom((get) => {
        if (!question.enable_when?.length) return true;
        const responses = get(responsesAtom);
        const linkIndex = get(questionIdByLinkIdAtom);
        const results = question.enable_when.map((condition) =>
          evaluateEnableWhen(
            condition,
            responses[linkIndex[condition.question] ?? ""],
          ),
        );
        return question.enable_behavior === "any"
          ? results.some(Boolean)
          : results.every(Boolean);
      }),
    [question],
  );
  return useAtomValue(enabledAtom);
}

export function useQuestionErrors(questionId: string) {
  const questionErrorsAtom = useMemo(
    () =>
      atom((get) =>
        get(errorsAtom).filter((error) => error.question_id === questionId),
      ),
    [questionId],
  );
  return useAtomValue(questionErrorsAtom);
}
