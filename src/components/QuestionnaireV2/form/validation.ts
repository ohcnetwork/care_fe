import type { TFunction } from "i18next";

import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/renderer/store";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

/**
 * The fill-mode validation seam the old renderer documented but never
 * implemented (`errorsAtom` had readers and no writer). Pure function so the
 * future fill host can run it at submit time and write the result into
 * `errorsAtom`; server-side errors merge through the same
 * `QuestionValidationError` shape.
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
      const values = responses[question.id]?.values ?? [];
      const answered = values.some(
        (entry) =>
          entry.value !== undefined &&
          entry.value !== null &&
          entry.value !== "",
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
