import type { TFunction } from "i18next";

import {
  buildLinkIndex,
  entryHasContent,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";
import { resolveStructuredSlotState } from "@/components/QuestionnaireV2/structured/registry";

import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/** Where the questionnaire is being filled — what decides whether a
 *  structured question's slot can show an input at all. */
export interface RequiredCheckContext {
  questionnaire: QuestionnaireRead;
  subject: RendererSubject;
  /** Question ids whose structured slot threw and is now showing the error
   *  boundary's notice (`structuredRenderFailedAtom`). */
  renderFailed: ReadonlySet<string>;
}

/**
 * Whether this structured question can accept an answer on this mount.
 * Broken slots are handled by structured-specific validation so the generic
 * required check does not stack a second, vaguer required error.
 */
export function structuredQuestionIsAnswerable(
  structuredType: string,
  questionId: string,
  context: RequiredCheckContext,
): boolean {
  if (context.renderFailed.has(questionId)) return false;
  const state = resolveStructuredSlotState(
    structuredType,
    context.questionnaire.subject_type,
    context.subject,
  );
  return state.kind === "ready";
}

/**
 * The fill-mode validation seam. Pure function: `fill/submit/` runs it per
 * form at submit time and writes the result into that form's `errorsAtom`;
 * server-side errors merge back through the same `QuestionValidationError`
 * shape.
 *
 * Only questions that are currently enabled and record answers can be
 * required-invalid; a response counts as answered when any entry has a
 * non-empty value.
 */
export function collectRequiredErrors(
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  t: TFunction,
  context: RequiredCheckContext,
): QuestionValidationError[] {
  const linkIndex = buildLinkIndex(questions);

  const errors: QuestionValidationError[] = [];
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (!isQuestionEnabledInState(question, responses, linkIndex)) continue;
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      if (question.type === "display" || !question.required) continue;
      // A structured question whose slot is showing a notice instead of an
      // input is NOT waived here — it still blocks the submit — but the
      // specific, named error for it is `collectStructuredErrors`' job
      // (same resolver, every non-ready state, see its docstring). Staying
      // out of the way here is what keeps a broken required question from
      // ALSO surfacing a generic "this field is required" alongside the
      // real message.
      if (
        question.structured_type &&
        !structuredQuestionIsAnswerable(
          question.structured_type,
          question.id,
          context,
        )
      ) {
        continue;
      }
      const values = responses[question.id]?.values ?? [];
      // An entry answers the question when it has real content, or carries a
      // coding or unit without a value (value-set selections, unit-only
      // quantities).
      const answered = values.some(
        (entry) =>
          entryHasContent(entry) || entry.coding != null || entry.unit != null,
      );
      if (!answered) {
        errors.push({
          question_id: question.id,
          error: t("field_required"),
        });
      }
    }
  };
  walk(questions);
  return errors;
}
