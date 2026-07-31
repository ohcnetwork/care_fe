import { atom, useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
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
      const initial =
        question.type === "choice"
          ? (question.answer_option ?? [])
              .filter((option) => option.initial_selected)
              .map((option) => ({
                type: "string" as const,
                value: option.value,
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

/** Port of QuestionGroup.isQuestionEnabled's operator logic.
 *  Handles type coercions from old system: booleans normalize to "Yes"/"No",
 *  numeric comparisons coerce strings to numbers. */
export function evaluateEnableWhen(
  enableWhen: EnableWhen,
  response: QuestionnaireResponse | undefined,
): boolean {
  const value = response?.values[0]?.value;

  switch (enableWhen.operator) {
    case "exists": {
      // enableWhen.answer is boolean for "exists"
      const exists = value !== undefined && value !== "" && value !== null;
      return enableWhen.answer === exists;
    }

    case "equals": {
      // enableWhen.answer can be boolean or string
      if (typeof enableWhen.answer === "boolean") {
        // If the answer we're comparing to is boolean, normalize the response value
        if (typeof value === "boolean") {
          return value === enableWhen.answer;
        }
        if (typeof value === "string") {
          // Normalize string response to boolean for comparison
          const normalized =
            value === "Yes" ? true : value === "No" ? false : null;
          return normalized === enableWhen.answer;
        }
        return false;
      }
      // enableWhen.answer is string
      if (typeof value === "boolean") {
        // Normalize boolean to string representation
        const normalized = value ? "Yes" : "No";
        return normalized === enableWhen.answer;
      }
      return value === enableWhen.answer;
    }

    case "not_equals": {
      // enableWhen.answer can be boolean or string
      if (typeof enableWhen.answer === "boolean") {
        // If the answer we're comparing to is boolean, normalize the response value
        if (typeof value === "boolean") {
          return value !== enableWhen.answer;
        }
        if (typeof value === "string") {
          // Normalize string response to boolean for comparison
          const normalized =
            value === "Yes" ? true : value === "No" ? false : null;
          return normalized !== enableWhen.answer;
        }
        return true;
      }
      // enableWhen.answer is string
      if (typeof value === "boolean") {
        // Normalize boolean to string representation
        const normalized = value ? "Yes" : "No";
        return normalized !== enableWhen.answer;
      }
      return value !== enableWhen.answer;
    }

    case "greater": {
      // enableWhen.answer is number
      const numValue = typeof value === "number" ? value : Number(value);
      return !isNaN(numValue) && numValue > enableWhen.answer;
    }

    case "less": {
      // enableWhen.answer is number
      const numValue = typeof value === "number" ? value : Number(value);
      return !isNaN(numValue) && numValue < enableWhen.answer;
    }

    case "greater_or_equals": {
      // enableWhen.answer is number
      const numValue = typeof value === "number" ? value : Number(value);
      return !isNaN(numValue) && numValue >= enableWhen.answer;
    }

    case "less_or_equals": {
      // enableWhen.answer is number
      const numValue = typeof value === "number" ? value : Number(value);
      return !isNaN(numValue) && numValue <= enableWhen.answer;
    }

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
