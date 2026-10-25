import type { Getter, Setter } from "jotai";
import { atom, useAtom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import { useMemo } from "react";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponsePath,
  ResponseValue,
} from "@/types/questionnaire/form";
import { EnableWhen, Question } from "@/types/questionnaire/question";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { entryIsAnswered } from "./inputs/answeredEntry";
import {
  getResponsesAtPath,
  getScopedResponses,
  responseMap,
  sameResponsePath,
  updateResponsesAtPath,
  useResponseScope,
} from "./responseScope";

export { entryHasContent } from "./inputs/answeredEntry";

export const questionnaireAtom = atom<QuestionnaireRead | null>(null);
export const responsesAtom = atom<Record<string, QuestionnaireResponse>>({});
export const errorsAtom = atom<QuestionValidationError[]>([]);

/**
 * Keys (see `renderFailedKey`) of structured slots that threw during render
 * and now show the error boundary's notice instead of an input. Validation
 * reads it so a required question with no input on screen cannot make the
 * form unsubmittable.
 */
export const structuredRenderFailedAtom = atom<ReadonlySet<string>>(
  new Set<string>(),
);

const pathKey = (path: ResponsePath) =>
  path.map((p) => `${p.questionId}:${p.rowIndex}`).join("/");

export function renderFailedKey(questionId: string, path: ResponsePath) {
  return `${questionId}@${pathKey(path)}`;
}

export function useMarkStructuredRenderFailed(questionId: string) {
  const path = useResponseScope();
  const markAtom = useMemo(
    () =>
      atom(null, (get, set) => {
        const key = renderFailedKey(questionId, path);
        const failed = get(structuredRenderFailedAtom);
        if (failed.has(key)) return;
        set(structuredRenderFailedAtom, new Set(failed).add(key));
      }),
    [questionId, path],
  );
  return useAtom(markAtom)[1];
}

export function useClearStructuredRenderFailed(questionId: string) {
  const path = useResponseScope();
  const clearAtom = useMemo(
    () =>
      atom(null, (get, set) => {
        const key = renderFailedKey(questionId, path);
        const failed = get(structuredRenderFailedAtom);
        if (!failed.has(key)) return;
        const next = new Set(failed);
        next.delete(key);
        set(structuredRenderFailedAtom, next);
      }),
    [questionId, path],
  );
  return useAtom(clearAtom)[1];
}

/** link_id → question_id for enable_when lookups. */
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

const questionIdByLinkIdAtom = atom((get) => {
  const questionnaire = get(questionnaireAtom);
  return questionnaire ? buildLinkIndex(questionnaire.questions) : {};
});

/** Flatten ordinary groups, seed choice defaults, and keep repeating groups
 *  as containers whose child answers are created separately for each row. */
export function initializeResponses(
  questions: Question[],
): Record<string, QuestionnaireResponse> {
  const responses: Record<string, QuestionnaireResponse> = {};
  const walk = (qs: Question[]) => {
    for (const question of qs) {
      if (question.type === "group" && !question.repeats) {
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
        ...(question.type === "group" ? { sub_results: [] } : {}),
      };
    }
  };
  walk(questions);
  return responses;
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  return value;
}

// Mirrors the backend's BOOLEAN_TRUE_STRINGS / BOOLEAN_FALSE_STRINGS.
const BOOLEAN_TRUE_STRINGS = new Set(["true", "on", "ok", "y", "yes", "1"]);
const BOOLEAN_FALSE_STRINGS = new Set(["false", "off", "no", "n", "0"]);

function foldBoolean(value: unknown): unknown {
  const normalized = normalizeValue(value);
  if (typeof normalized !== "string") return normalized;
  const lower = normalized.trim().toLowerCase();
  if (BOOLEAN_TRUE_STRINGS.has(lower)) return "Yes";
  if (BOOLEAN_FALSE_STRINGS.has(lower)) return "No";
  return normalized;
}

/** Evaluates one enable_when condition against its controller's response
 *  the way the backend does: only answered entries count, and every entry
 *  is considered. */
export function evaluateEnableWhen(
  enableWhen: EnableWhen,
  response: QuestionnaireResponse | undefined,
): boolean {
  const answered = (response?.values ?? []).filter(entryIsAnswered);

  if (enableWhen.operator === "exists") {
    return enableWhen.answer === false
      ? answered.length === 0
      : answered.length > 0;
  }

  if (answered.length === 0) return false;

  const normalizedAnswers = answered.map((v) => normalizeValue(v.value));

  switch (enableWhen.operator) {
    case "equals":
      return answered
        .map((v) => foldBoolean(v.value))
        .includes(foldBoolean(enableWhen.answer));

    case "not_equals":
      return !answered
        .map((v) => foldBoolean(v.value))
        .includes(foldBoolean(enableWhen.answer));

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
}

export function clearQuestionErrorsInState(
  get: Getter,
  set: Setter,
  questionId: string,
  path: ResponsePath = [],
) {
  const errors = get(errorsAtom);
  const matches = (error: QuestionValidationError) =>
    error.question_id === questionId &&
    (!error.response_path || sameResponsePath(error.response_path, path));
  if (!errors.some(matches)) return;
  set(
    errorsAtom,
    errors.filter((error) => !matches(error)),
  );
}

export function useClearQuestionErrors(questionId: string) {
  const path = useResponseScope();
  const clearAtom = useMemo(
    () =>
      atom(null, (get, set) =>
        clearQuestionErrorsInState(get, set, questionId, path),
      ),
    [questionId, path],
  );
  return useAtom(clearAtom)[1];
}

export function useQuestionResponse(questionId: string) {
  const path = useResponseScope();
  const responseAtom = useMemo(
    () =>
      atom(
        (get) => getResponsesAtPath(get(responsesAtom), path)[questionId],
        (get, set, update: Partial<QuestionnaireResponse>) => {
          const previous = get(responsesAtom);
          const current = getResponsesAtPath(previous, path)[questionId];
          if (!current) return;
          set(
            responsesAtom,
            updateResponsesAtPath(previous, path, { [questionId]: update }),
          );
          clearQuestionErrorsInState(get, set, questionId, path);
          if (
            update.sub_results &&
            update.sub_results.length !== current.sub_results?.length
          ) {
            // Rows shifted: drop every mark and error recorded under a row.
            const underRow = (rowPath: ResponsePath) =>
              sameResponsePath(rowPath.slice(0, path.length), path) &&
              rowPath[path.length]?.questionId === questionId;
            set(errorsAtom, (errors) =>
              errors.filter(
                (error) =>
                  !error.response_path || !underRow(error.response_path),
              ),
            );
            const rowPrefix = `@${pathKey(path)}${path.length ? "/" : ""}${questionId}:`;
            set(structuredRenderFailedAtom, (failed) => {
              const next = new Set(
                [...failed].filter((key) => !key.includes(rowPrefix)),
              );
              return next.size === failed.size ? failed : next;
            });
          }
        },
      ),
    [questionId, path],
  );
  return useAtom(responseAtom);
}

/** Every condition is evaluated against the root response map, matching
 *  the backend; row answers never shadow root answers. */
export function isQuestionEnabledInState(
  question: Question,
  responses: Record<string, QuestionnaireResponse>,
  linkIndex: Record<string, string>,
): boolean {
  if (!question.enable_when?.length) return true;
  const results = question.enable_when.map((condition) =>
    condition.question in linkIndex
      ? evaluateEnableWhen(condition, responses[linkIndex[condition.question]])
      : false,
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

/** Ids of every question currently hidden by enable_when (disabled and not
 *  `disabled_display: "protected"`). */
export function useHiddenQuestionIds(): Set<string> {
  const hiddenIdsAtom = useMemo(
    () =>
      atom((get) => {
        const questionnaire = get(questionnaireAtom);
        const hidden = new Set<string>();
        if (!questionnaire) return hidden;
        const responses = get(responsesAtom);
        const linkIndex = get(questionIdByLinkIdAtom);
        const visible = new Set<string>();
        const walk = (
          questions: Question[],
          scope: Record<string, QuestionnaireResponse>,
          parentVisible = true,
        ) => {
          for (const question of questions) {
            const shown =
              parentVisible &&
              (question.disabled_display === "protected" ||
                isQuestionEnabledInState(question, responses, linkIndex));
            if (shown) visible.add(question.id);
            else hidden.add(question.id);
            if (question.type === "group" && question.repeats) {
              const rows = scope[question.id]?.sub_results ?? [];
              if (!rows.length) walk(question.questions ?? [], scope, false);
              for (const row of rows)
                walk(question.questions ?? [], responseMap(row), shown);
            } else {
              walk(question.questions ?? [], scope, shown);
            }
          }
        };
        walk(questionnaire.questions, responses);
        visible.forEach((id) => hidden.delete(id));
        return hidden;
      }),
    [],
  );
  return useAtomValue(hiddenIdsAtom);
}

/** Boolean rather than the index list so the canvas body does not re-render
 *  on every answer edit. */
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

/** Ids of every question with at least one recorded answer. */
export function useAnsweredQuestionIds(): Set<string> {
  const answeredAtom = useMemo(
    () =>
      atom((get) => {
        const answered = new Set<string>();
        const walk = (responses: QuestionnaireResponse[]): boolean => {
          let anyAnswered = false;
          for (const response of responses) {
            const childrenAnswered = (response.sub_results ?? [])
              .map(walk)
              .some(Boolean);
            if (response.values?.some(entryIsAnswered) || childrenAnswered) {
              answered.add(response.question_id);
              anyAnswered = true;
            }
          }
          return anyAnswered;
        };
        walk(Object.values(get(responsesAtom)));
        return answered;
      }),
    [],
  );
  return useAtomValue(answeredAtom);
}

export function useQuestionErrors(questionId: string) {
  const path = useResponseScope();
  const questionErrorsAtom = useMemo(
    () =>
      selectAtom(
        errorsAtom,
        (errors) =>
          errors.filter(
            (error) =>
              error.question_id === questionId &&
              (!error.response_path ||
                sameResponsePath(error.response_path, path)),
          ),
        (previous, next) =>
          previous.length === next.length &&
          previous.every((error, index) => error === next[index]),
      ),
    [questionId, path],
  );
  return useAtomValue(questionErrorsAtom);
}

export function useScopedResponses() {
  const path = useResponseScope();
  const scoped = useMemo(
    () => atom((get) => getScopedResponses(get(responsesAtom), path)),
    [path],
  );
  return useAtomValue(scoped);
}

export function useScopedErrors() {
  const path = useResponseScope();
  const scoped = useMemo(
    () =>
      selectAtom(errorsAtom, (errors) =>
        errors.filter(
          (error) =>
            !error.response_path || sameResponsePath(error.response_path, path),
        ),
      ),
    [path],
  );
  return useAtomValue(scoped);
}
