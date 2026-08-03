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
      // A structured question whose slot shows a placeholder instead of an
      // input (subject mismatch, or the mount can't supply an id the type
      // `requires`) cannot be answered — and `composeBatch` drops its data
      // anyway. Requiring it deadlocks the whole form. Same predicate
      // `StructuredSlot` renders from; see `StructuredSlotState`'s parity
      // note. An unknown type is NOT exempt: `collectStructuredErrors`
      // deliberately blocks a required question whose plugin is missing.
      if (question.structured_type) {
        const state = resolveStructuredSlotState(
          question.structured_type,
          context.questionnaire.subject_type,
          context.subject,
        );
        if (
          state.kind === "subject_mismatch" ||
          state.kind === "missing_context"
        ) {
          continue;
        }
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
