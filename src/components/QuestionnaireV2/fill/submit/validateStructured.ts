import type { TFunction } from "i18next";

import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/renderer/store";
import {
  resolveStructuredType,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/**
 * Submit-time structured validation: each enabled structured question runs
 * its type's `validate` from the resolver (core definitions and plugin
 * ones alike). Same disabled-subtree skip as composeBatch/validation.ts.
 * Types not declared for the questionnaire's `subject_type` are skipped —
 * they can't reach the domain API (composeBatch drops them too), so
 * validating them would only block submission on data that never submits.
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
      const definition = resolveStructuredType(type);
      if (!definition) {
        if (question.required) {
          errors.push({
            question_id: question.id,
            error: t("structured_type_plugin_missing", { type }),
          });
        }
        continue;
      }
      if (!definition.subjects.includes(questionnaire.subject_type)) continue;
      if (!definition.validate) continue;
      const response = responses[question.id];
      // The recorded entries must belong to this question's type — the
      // guard `structuredDataOf` used to carry, kept now that the data
      // read is untyped.
      if (response?.structured_type !== type) continue;
      const data = structuredDataAny(response);
      if (data.length === 0) continue;
      errors.push(
        ...definition.validate(data, question.id, question.required ?? false),
      );
    }
  };
  walk(questionnaire.questions);
  return errors;
}
