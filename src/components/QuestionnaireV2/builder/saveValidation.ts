import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

import { Question } from "@/types/questionnaire/question";

interface SaveCheck {
  predicate: (question: Question) => boolean;
  /** i18n key for the toast shown when the predicate matches. */
  messageKey: string;
}

/**
 * Ordered save-time validation rules for the builder. Each is a pure
 * predicate over one question; the first match (pre-order DFS over the whole
 * tree) blocks the save. Add new rules here — the builder page's handleSave
 * loops over the result, so no page changes are needed.
 */
const SAVE_CHECKS: SaveCheck[] = [
  {
    // Every question needs a title.
    predicate: (question) => !question.text.trim(),
    messageKey: "question_titles_required",
  },
  {
    // Group questions must contain at least one sub-question.
    predicate: (question) =>
      question.type === "group" && (question.questions?.length ?? 0) === 0,
    messageKey: "group_needs_subquestion",
  },
  {
    // A visibility condition with no target question selected. Persisting
    // such a condition would hide the question forever in fill mode (both
    // evaluators resolve link_id "" to "no response" → false), so save is
    // blocked until it's completed or removed.
    predicate: (question) =>
      question.enable_when?.some((condition) => !condition.question) ?? false,
    messageKey: "condition_target_required",
  },
];

/** The first question failing any save check, with the message to show —
 *  or undefined when the tree is saveable. */
export function findFirstInvalidQuestion(
  questions: Question[],
): { question: Question; messageKey: string } | undefined {
  for (const { predicate, messageKey } of SAVE_CHECKS) {
    const question = findFirstQuestion(questions, predicate);
    if (question) return { question, messageKey };
  }
  return undefined;
}
