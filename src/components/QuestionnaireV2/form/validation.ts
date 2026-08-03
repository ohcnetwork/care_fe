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
 * Can this structured question be ANSWERED on this mount right now? False
 * whenever `StructuredSlot` is showing a notice instead of an input — an
 * unknown/disabled type, a subject the type doesn't declare, a context id
 * the mount can't supply, or a component that threw during render.
 *
 * This does NOT decide whether the question is required-blocked — it only
 * tells `collectRequiredErrors` when to stay out of the way. A broken
 * slot's actual required-error (named, specific to the failure) is
 * `collectStructuredErrors`' job alone, for every one of these states
 * alike (see its docstring); letting the generic check here ALSO fire
 * would stack a second, vaguer "this field is required" under the same
 * question. `renderFailed` and the other three states come from the same
 * two sources `StructuredSlot` itself reads (`resolveStructuredSlotState`
 * and the error boundary's store), so this and the specific validator can
 * never disagree about which slots are broken.
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
 * Mirrors the legacy QuestionnaireForm required check: only questions that
 * are currently enabled (same enable_when evaluation as rendering) and
 * record answers (not group/display) can be required-invalid; a response
 * counts as answered when any entry has a non-empty value.
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
      // Legacy contract: an entry answers the question when it has real
      // content (non-empty scalar / non-empty array), OR carries a coding
      // or unit without a value (value-set selections, unit-only
      // quantities) — QuestionnaireForm.tsx's hasValue/hasCoding/hasUnit.
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
