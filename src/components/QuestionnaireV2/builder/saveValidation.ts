import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

import { Question, QuestionType } from "@/types/questionnaire/question";

/**
 * Types the renderer never records a response for: `initializeResponses`
 * (renderer/store.ts) skips `group` entirely, and `display` gets an entry
 * whose values `DisplayText` never writes — so `evaluateEnableWhen` sees
 * "unanswered" forever and a condition targeting one permanently hides its
 * question with zero feedback. The visibility card excludes them from the
 * target picker, and the save check below blocks legacy data that already
 * targets one. Structured questions stay eligible: they DO record values
 * (StructuredQuestionSlot writes through `updateResponse`), matching the
 * legacy editor, which offered every non-group question as a target.
 */
export const NON_RESPONSE_TYPES: QuestionType[] = ["group", "display"];

/** Tree-wide lookups built once per validation run, for checks that need to
 *  resolve a condition's target link_id against the rest of the tree. */
interface SaveCheckContext {
  typeByLinkId: Map<string, QuestionType>;
}

interface SaveCheck {
  predicate: (question: Question, context: SaveCheckContext) => boolean;
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
    // The backend rejects quantity questions carrying neither answer_option
    // nor answer_value_set (Question spec validate_choice_and_group_questions),
    // so surface a clear client-side error instead of a raw 400. The builder
    // only authors the valueset (legacy contract: quantity was never
    // custom-options), but grandfathered answer_option data still passes.
    predicate: (question) =>
      question.type === "quantity" &&
      !question.answer_value_set &&
      (question.answer_option?.length ?? 0) === 0,
    messageKey: "quantity_needs_valueset",
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
  {
    // A visibility condition targeting a question that never records a
    // response (see NON_RESPONSE_TYPES) — the picker no longer offers these,
    // but legacy/imported data can still carry one; it would hide the
    // question forever, so the save is blocked until it's retargeted.
    predicate: (question, { typeByLinkId }) =>
      question.enable_when?.some((condition) => {
        const targetType = typeByLinkId.get(condition.question);
        return (
          targetType !== undefined && NON_RESPONSE_TYPES.includes(targetType)
        );
      }) ?? false,
    messageKey: "condition_target_not_answerable",
  },
];

/** The first question failing any save check, with the message to show —
 *  or undefined when the tree is saveable. */
export function findFirstInvalidQuestion(
  questions: Question[],
): { question: Question; messageKey: string } | undefined {
  const typeByLinkId = new Map<string, QuestionType>();
  const walk = (list: Question[]) => {
    for (const question of list) {
      typeByLinkId.set(question.link_id, question.type);
      walk(question.questions ?? []);
    }
  };
  walk(questions);
  const context: SaveCheckContext = { typeByLinkId };

  for (const { predicate, messageKey } of SAVE_CHECKS) {
    const question = findFirstQuestion(questions, (candidate) =>
      predicate(candidate, context),
    );
    if (question) return { question, messageKey };
  }
  return undefined;
}
