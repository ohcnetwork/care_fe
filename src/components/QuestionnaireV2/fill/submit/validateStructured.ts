import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/renderer/store";
import {
  structuredDataOf,
  structuredDefinitionFor,
} from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/**
 * Submit-time structured validation: each enabled structured question runs
 * its type's `validate` from the registry (the legacy
 * STRUCTURED_TYPE_VALIDATORS map, relocated into the per-type
 * definitions). Same disabled-subtree skip as composeBatch/validation.ts.
 * Types not declared for the questionnaire's `subject_type` are skipped —
 * they can't reach the domain API (composeBatch drops them too), so
 * validating them would only block submission on data that never submits.
 */
export function collectStructuredErrors(
  questionnaire: QuestionnaireRead,
  responses: Record<string, QuestionnaireResponse>,
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
      const definition = structuredDefinitionFor(type);
      if (!definition.subjects.includes(questionnaire.subject_type)) continue;
      if (!definition.validate) continue;
      const data = structuredDataOf(type, responses[question.id]);
      if (data.length === 0) continue;
      errors.push(
        ...definition.validate(data, question.id, question.required ?? false),
      );
    }
  };
  walk(questionnaire.questions);
  return errors;
}
