import type { TFunction } from "i18next";

import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";
import {
  resolveStructuredSlotState,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";

import { structuredEditsOf } from "@/components/QuestionnaireV2/fill/submit/composeStructured";
import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/**
 * Submit-time structured validation. Enabled structured questions use the same
 * slot-state resolver as the renderer; unavailable required sections block
 * submit with a visible question error, while unavailable optional sections
 * are skipped to match compose behavior. Ready sections run their type's
 * validator and return finished message text.
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
      // The component threw (error boundary's own store) OR the resolver
      // says anything but `ready` — unknown/disabled type, subject
      // mismatch, missing context. Either way the slot shows a notice, not
      // an input: a required question in this state hard-blocks, named; a
      // non-required one is simply skipped, same as `composeBatch`. Skip
      // resolving state at all once render already failed — there is
      // nothing left to read a `ready` definition from.
      const state = renderFailed.has(question.id)
        ? undefined
        : resolveStructuredSlotState(type, questionnaire.subject_type, subject);
      if (!state || state.kind !== "ready") {
        if (question.required) {
          errors.push({
            question_id: question.id,
            error: t("structured_section_unavailable_required", {
              label: question.text,
            }),
          });
        }
        continue;
      }
      const definition = state.definition;
      if (!definition.validate) continue;
      const response = responses[question.id];
      // The recorded entries must belong to this question's type.
      if (response?.structured_type !== type) continue;
      const required = question.required ?? false;
      const projection = structuredDataAny(response);
      const edits = structuredEditsOf(response);
      // Nothing recorded AND nothing changed. The two halves answer
      // different questions, so neither may gate the other: a
      // NON-empty projection with an empty log still runs (a required
      // section satisfied by rows the server already had); a non-empty log
      // with an empty projection still runs (the clinician removed every
      // row).
      if (projection.length === 0 && edits.length === 0) continue;
      try {
        errors.push(
          ...definition.validate(projection, edits, question.id, required),
        );
      } catch (error) {
        // Plugin code runs here. Contain throws as one question-scoped error
        // the clinician can see and act on; the submit then aborts through
        // the normal validation path instead of becoming a silent no-op.
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
