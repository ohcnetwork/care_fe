/**
 * The form engine's state scope — one Jotai store per mounted form,
 * created by `form/FormContext`'s provider. `responsesAtom` is the
 * per-instance working state: in preview it stays local; in fill mode the
 * host reads it for submission and autosave. `errorsAtom` is written by
 * the fill submit path
 * (`fill/submit/useSubmitFillSession`) with client validation failures
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

/**
 * Question ids whose structured slot THREW during render and are now
 * showing the error boundary's notice instead of an input.
 *
 * Submit-time enforcement reads this alongside the subject-mismatch and
 * missing-context cases: all three mean "this question has no input on
 * screen", and requiring an unanswerable question makes the entire form —
 * every other answer included — permanently unsubmittable. Lives in the
 * store because the boundary that discovers it and the validators that
 * must respect it never meet in the component tree.
 */
export const structuredRenderFailedAtom = atom<ReadonlySet<string>>(
  new Set<string>(),
);

/** Record a structured slot's render failure. Idempotent: re-entering the
 *  boundary for a question already marked keeps the same Set identity, so
 *  it cannot loop a subscriber. */
export function useMarkStructuredRenderFailed(questionId: string) {
  const markAtom = useMemo(
    () =>
      atom(null, (get, set) => {
        const failed = get(structuredRenderFailedAtom);
        if (failed.has(questionId)) return;
        set(structuredRenderFailedAtom, new Set(failed).add(questionId));
      }),
    [questionId],
  );
  return useAtom(markAtom)[1];
}

/** Clear a question's render-failed mark — the recovery half of the pair
 *  above. A slot unmounts and remounts whenever enable_when toggles it (or
 *  an ancestor group), and the fresh boundary may well render fine; the
 *  mark must not outlive the notice it described, or a LIVE required input
 *  would stay exempt from validation for the rest of the session.
 *  Idempotent the same way: clearing an unmarked question keeps the Set
 *  identity. */
export function useClearStructuredRenderFailed(questionId: string) {
  const clearAtom = useMemo(
    () =>
      atom(null, (get, set) => {
        const failed = get(structuredRenderFailedAtom);
        if (!failed.has(questionId)) return;
        const next = new Set(failed);
        next.delete(questionId);
        set(structuredRenderFailedAtom, next);
      }),
    [questionId],
  );
  return useAtom(clearAtom)[1];
}

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

/** link_id → question_id, for enable_when lookups. Internal: consumers
 *  outside the engine call `buildLinkIndex` on the tree they hold. */
const questionIdByLinkIdAtom = atom((get) => {
  const questionnaire = get(questionnaireAtom);
  return questionnaire ? buildLinkIndex(questionnaire.questions) : {};
});

/** Flatten the tree into one response per non-group question, seeding
 *  initial_selected answer options. */
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

/** Booleans normalize to "Yes"/"No" and numbers stringify before ANY
 *  operator is applied — matching how recorded response values are
 *  normalized, so enable_when comparisons can match them. */
function normalizeValue(value: unknown): unknown {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  return value;
}

/** Evaluates one enable_when condition against its controller question's
 *  response, matching backend semantics:
 *  - the unanswered-dependency short-circuit (no recorded values → false)
 *    applies to every operator EXCEPT `exists`, which — matching the
 *    backend — evaluates even when the controller is unanswered, since an
 *    `exists:false` dependent must enable precisely then
 *  - ALL of the controller's values are considered (`.some()` /
 *    `.includes()`), not just the first
 *  - `normalizeValue` is applied before every operator other than
 *    `exists`, which only asks whether real content was recorded */
export function evaluateEnableWhen(
  enableWhen: EnableWhen,
  response: QuestionnaireResponse | undefined,
): boolean {
  const dependentValues = response?.values;

  // "exists" must evaluate even when the controller is unanswered: the
  // backend enables an exists:false dependent precisely when the controller
  // has no value. "" is treated as not-existing because serialization drops
  // content-free entries, so the backend never sees them.
  if (enableWhen.operator === "exists") {
    const has =
      !!dependentValues &&
      dependentValues.some(
        (v) => v.value !== undefined && v.value !== null && v.value !== "",
      );
    return enableWhen.answer === false ? !has : has;
  }

  if (!dependentValues || dependentValues.length === 0) return false;

  const normalizedAnswers = dependentValues.map((v) => normalizeValue(v.value));

  switch (enableWhen.operator) {
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
function clearQuestionErrorsInState(
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

/**
 * A projection-only write for a structured question's `values` mirror —
 * deliberately skips {@link clearQuestionErrorsInState}, unlike
 * {@link useQuestionResponse}'s setter.
 *
 * `useStructuredRows` writes a question's response from two kinds of
 * event. A mutator records real intent — clearing the question's prior
 * errors on that write is correct, and those writes go through
 * `useQuestionResponse`'s setter. But it also mirrors `baseline + edits`
 * into `values` on every baseline movement (first load, refetch, cache
 * invalidation) via a passive effect that records no new intent; routing
 * that through the intent setter would let a background refetch silently
 * clear a showing submit-time server error while the offending value
 * stayed on screen. This setter writes `values` alone and leaves
 * `errorsAtom` untouched, so only genuine user (or seed) intent ever
 * clears a question's errors.
 *
 * Scoped to `values` (never `edits`) on purpose — a passive mirror of
 * baseline movement must never touch the edit log, which is the one thing
 * drafts persist and submit reads. The one passive write that DOES have to
 * rewrite the log is {@link useSetQuestionRowsPassively}.
 */
export function useSetQuestionProjection(questionId: string) {
  const setAtom = useMemo(
    () =>
      atom(null, (get, set, values: ResponseValue[]) => {
        const previous = get(responsesAtom);
        const current = previous[questionId];
        if (!current) return;
        set(responsesAtom, {
          ...previous,
          [questionId]: { ...current, values },
        });
      }),
    [questionId],
  );
  return useAtom(setAtom)[1];
}

/**
 * The `values` mirror AND the edit log, written together and WITHOUT
 * clearing this question's errors — the orphan prune's path, and the only
 * sanctioned reason to rewrite `edits` outside {@link useQuestionResponse}'s
 * setter.
 *
 * The prune excises edits whose baseline row vanished server-side. That is
 * baseline movement, not clinician intent, so the same rule
 * {@link useSetQuestionProjection} exists for applies: a refetch that
 * delivers a smaller baseline must not silently clear a showing submit-time
 * server error while the offending values stay on screen. It writes both
 * keys in one set so no subscriber ever sees `values` and `edits` disagree.
 */
export function useSetQuestionRowsPassively(questionId: string) {
  const setAtom = useMemo(
    () =>
      atom(
        null,
        (get, set, update: Pick<QuestionnaireResponse, "values" | "edits">) => {
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
  return useAtom(setAtom)[1];
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
 * Ids of every question in the tree (any depth) currently hidden by its
 * enable_when conditions — i.e. disabled and not `disabled_display:
 * "protected"` (protected questions still render, greyed). The tree navs
 * use this to drop rows for questions that aren't on the canvas.
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
 *  scalar, or a non-empty array (structured/repeat values). Shared with
 *  form/validation.ts so the required check and the outline's completion
 *  icons agree on what "answered" means. */
export function entryHasContent(entry: ResponseValue): boolean {
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
