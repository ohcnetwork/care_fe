/**
 * Renderer state scope: `responsesAtom` is the per-instance working state.
 * In preview it stays local; in fill mode the host reads it for submission
 * and autosave. `errorsAtom` is written by the fill submit path
 * (`fill/submit/useSubmitQuestionnaire`) with client validation failures
 * and mapped server errors; editing a question's response clears that
 * question's entries (the write path below), so stale errors never outlive
 * the answer they flagged.
 */
import type { Getter, Setter } from "jotai";
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

/** link_id → question_id for enable_when lookups — pure so non-atom
 *  consumers (form/validation.ts) share the exact same resolution. */
export function buildLinkIndex(questions: Question[]): Record<string, string> {
  const index: Record<string, string> = {};
  const walk = (list: Question[]) => {
    for (const question of list) {
      index[question.link_id] = question.id;
      if (question.questions) walk(question.questions);
    }
  };
  walk(questions);
  return index;
}

/** link_id → question_id, for enable_when lookups. */
export const questionIdByLinkIdAtom = atom((get) => {
  const questionnaire = get(questionnaireAtom);
  return questionnaire ? buildLinkIndex(questionnaire.questions) : {};
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
      // enableWhen.answer is boolean | string here (EnableWhenBoolean |
      // EnableWhenString). Legacy questionnaires store JSON true/false while
      // responses normalize to "Yes"/"No" — run the stored answer through
      // the same normalization so those conditions can ever match. (Only
      // literal booleans are normalized; string answers pass through
      // untouched, so non-boolean comparisons are unaffected.)
      return normalizedAnswers.includes(normalizeValue(enableWhen.answer));

    case "not_equals":
      // enableWhen.answer is boolean | string here (EnableWhenBoolean | EnableWhenString)
      return !normalizedAnswers.includes(normalizeValue(enableWhen.answer));

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

/** Drop one question's entries from `errorsAtom` — shared by the response
 *  write path (edit clears the flag) and the structured slot's
 *  `clearError` prop. No-ops when the question has no errors so
 *  subscribers don't re-render on unrelated edits. */
export function clearQuestionErrorsInState(
  get: Getter,
  set: Setter,
  questionId: string,
) {
  const errors = get(errorsAtom);
  if (!errors.some((error) => error.question_id === questionId)) return;
  set(
    errorsAtom,
    errors.filter((error) => error.question_id !== questionId),
  );
}

export function useClearQuestionErrors(questionId: string) {
  const clearAtom = useMemo(
    () =>
      atom(null, (get, set) =>
        clearQuestionErrorsInState(get, set, questionId),
      ),
    [questionId],
  );
  return useAtom(clearAtom)[1];
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
          // An edit supersedes any validation error recorded against this
          // question (client or server) — clear just its entries.
          clearQuestionErrorsInState(get, set, questionId);
        },
      ),
    [questionId],
  );
  return useAtom(responseAtom);
}

/** Shared enable_when resolution — extracted (unchanged semantics) so every
 *  consumer (useQuestionEnabled, the visibility hooks below, and
 *  form/validation.ts) evaluates identically. Exported so the fill path
 *  never re-derives it from evaluateEnableWhen. */
export function isQuestionEnabledInState(
  question: Question,
  responses: Record<string, QuestionnaireResponse>,
  linkIndex: Record<string, string>,
): boolean {
  if (!question.enable_when?.length) return true;
  const results = question.enable_when.map((condition) =>
    evaluateEnableWhen(
      condition,
      responses[linkIndex[condition.question] ?? ""],
    ),
  );
  return question.enable_behavior === "any"
    ? results.some(Boolean)
    : results.every(Boolean);
}

export function useQuestionEnabled(question: Question): boolean {
  const enabledAtom = useMemo(
    () =>
      atom((get) =>
        isQuestionEnabledInState(
          question,
          get(responsesAtom),
          get(questionIdByLinkIdAtom),
        ),
      ),
    [question],
  );
  return useAtomValue(enabledAtom);
}

/**
 * Indices of top-level questions that should take part in pagination.
 *
 * The legacy renderer showed the whole questionnaire in one scroll page, so
 * an enable_when-hidden question simply didn't appear — the paginated v2
 * renderer must skip those indices rather than serve blank pages.
 * `disabled_display: "protected"` questions stay included because
 * QuestionField still renders them (greyed) when disabled.
 */
export function useVisibleTopLevelIndices(): number[] {
  const visibleIndicesAtom = useMemo(
    () =>
      atom((get) => {
        const questionnaire = get(questionnaireAtom);
        if (!questionnaire) return [];
        const responses = get(responsesAtom);
        const linkIndex = get(questionIdByLinkIdAtom);
        const indices: number[] = [];
        questionnaire.questions.forEach((question, index) => {
          if (
            question.disabled_display === "protected" ||
            isQuestionEnabledInState(question, responses, linkIndex)
          ) {
            indices.push(index);
          }
        });
        return indices;
      }),
    [],
  );
  return useAtomValue(visibleIndicesAtom);
}

/**
 * Ids of every question in the tree (any depth) currently hidden by its
 * enable_when conditions — i.e. disabled and not `disabled_display:
 * "protected"` (protected questions still render, greyed). The tree nav
 * uses this to drop rows for questions that don't exist on the page,
 * including nested children the top-level-only pagination set misses.
 */
export function useHiddenQuestionIds(): Set<string> {
  const hiddenIdsAtom = useMemo(
    () =>
      atom((get) => {
        const questionnaire = get(questionnaireAtom);
        const hidden = new Set<string>();
        if (!questionnaire) return hidden;
        const responses = get(responsesAtom);
        const linkIndex = get(questionIdByLinkIdAtom);
        const walk = (questions: Question[]) => {
          for (const question of questions) {
            if (
              question.disabled_display !== "protected" &&
              !isQuestionEnabledInState(question, responses, linkIndex)
            ) {
              hidden.add(question.id);
            }
            walk(question.questions ?? []);
          }
        };
        walk(questionnaire.questions);
        return hidden;
      }),
    [],
  );
  return useAtomValue(hiddenIdsAtom);
}

/**
 * Whether any top-level question is currently on the canvas. Boolean (not
 * the index array) so the value is Object.is-stable across answer edits —
 * the one-scroll canvas body subscribes to this, and answering a question
 * must not re-render every block.
 */
export function useHasVisibleTopLevelQuestions(): boolean {
  const hasVisibleAtom = useMemo(
    () =>
      atom((get) => {
        const questionnaire = get(questionnaireAtom);
        if (!questionnaire) return false;
        const responses = get(responsesAtom);
        const linkIndex = get(questionIdByLinkIdAtom);
        return questionnaire.questions.some(
          (question) =>
            question.disabled_display === "protected" ||
            isQuestionEnabledInState(question, responses, linkIndex),
        );
      }),
    [],
  );
  return useAtomValue(hasVisibleAtom);
}

/** Whether one recorded entry carries an actual answer — non-empty
 *  scalar, or a non-empty array (structured/repeat values). Mirrors the
 *  required-check semantics in form/validation.ts plus the legacy
 *  array-emptiness rule. */
function entryHasContent(entry: ResponseValue): boolean {
  if (entry.value === undefined || entry.value === null || entry.value === "")
    return false;
  return !Array.isArray(entry.value) || entry.value.length > 0;
}

/**
 * Ids of every question with at least one recorded answer — the fill
 * outline's completion icons subscribe to this. Derived per render of the
 * consuming component only (one subscriber: the outline), so the fresh
 * Set identity per responses change is fine.
 */
export function useAnsweredQuestionIds(): Set<string> {
  const answeredAtom = useMemo(
    () =>
      atom((get) => {
        const answered = new Set<string>();
        for (const [id, response] of Object.entries(get(responsesAtom))) {
          if (response.values.some(entryHasContent)) answered.add(id);
        }
        return answered;
      }),
    [],
  );
  return useAtomValue(answeredAtom);
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
