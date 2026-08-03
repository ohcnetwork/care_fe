import type { TFunction } from "i18next";

import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";
import {
  resolveStructuredSlotState,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";

import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/**
 * Submit-time structured validation: each enabled structured question runs
 * its type's `validate` from the resolver (core definitions and plugin
 * ones alike). Same disabled-subtree skip as composeBatch/validation.ts.
 *
 * A question whose slot cannot show an input is skipped — subject
 * mismatch, a mount that can't supply an id the type `requires`, or a
 * component that threw and left the error boundary's notice in its place.
 * The clinician has no way to answer any of those, and composeBatch drops
 * their data regardless, so validating them would only block submission on
 * data that never submits. Shares one predicate with `collectRequiredErrors`
 * — see `structuredQuestionIsAnswerable`'s parity note.
 *
 * A type this deployment doesn't have blocks the submit only when the
 * question is required: an optional question whose plugin is disabled is
 * simply unanswerable, while a required one must not submit silently
 * incomplete. `t` is threaded in the same way `collectRequiredErrors`
 * takes it — errors carry finished message text, not keys.
 */
export function collectStructuredErrors(
  questionnaire: QuestionnaireRead,
  responses: Record<string, QuestionnaireResponse>,
  subject: RendererSubject,
  renderFailed: ReadonlySet<string>,
  t: TFunction,
): QuestionValidationError[] {
  const linkIndex = buildLinkIndex(questionnaire.questions);
  const errors: QuestionValidationError[] = [];

  const walk = (list: Question[]) => {
    for (const question of list) {
      if (!isQuestionEnabledInState(question, responses, linkIndex)) continue;
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      if (question.type !== "structured" || !question.structured_type) {
        continue;
      }
      const type = question.structured_type;
      // The slot's component threw — the notice is on screen, not an
      // input, so there is nothing here to validate.
      if (renderFailed.has(question.id)) continue;
      const state = resolveStructuredSlotState(
        type,
        questionnaire.subject_type,
        subject,
      );
      if (state.kind === "unknown_type") {
        if (question.required) {
          errors.push({
            question_id: question.id,
            error: t("structured_type_plugin_missing", { type }),
          });
        }
        continue;
      }
      if (state.kind !== "ready") continue;
      const definition = state.definition;
      if (!definition.validate) continue;
      const response = responses[question.id];
      // The recorded entries must belong to this question's type — the
      // guard `structuredDataOf` used to carry, kept now that the data
      // read is untyped.
      if (response?.structured_type !== type) continue;
      const data = structuredDataAny(response);
      if (data.length === 0) continue;
      try {
        errors.push(
          ...definition.validate(data, question.id, question.required ?? false),
        );
      } catch (error) {
        // Plugin code runs here. An escaping throw used to propagate out of
        // `submit()` (invoked as `void submit()`), so Save Changes became a
        // silent no-op for the WHOLE session — no toast, no panel, no
        // batch. Contain it the way `invokeAction` contains a thrown plugin
        // action: one question-scoped error the clinician can see and act
        // on, and the submit aborts through the normal validation path.
        console.error(
          `Structured type "${type}" threw while validating question ${question.id}`,
          error,
        );
        errors.push({
          question_id: question.id,
          error: t("structured_question_validate_failed"),
        });
      }
    }
  };
  walk(questionnaire.questions);
  return errors;
}
