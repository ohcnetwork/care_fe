import type { TFunction } from "i18next";

import { entryIsAnswered } from "@/components/QuestionnaireV2/form/engine/inputs/answeredEntry";
import { responseMap } from "@/components/QuestionnaireV2/form/engine/responseScope";

import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";
import { actionReferencedLinkIds } from "@/components/QuestionnaireV2/shared/actionExpression";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/**
 * The fill-side safety net for questionnaire actions. The backend puts
 * `q_<link_id>` into an action's namespace only for ANSWERED questions —
 * a referenced question left blank makes the evaluator raise, the whole
 * batch roll back, and the clinician see a generic failure with no field
 * to fix. Caught here, on the question, before anything is sent.
 *
 * Runs alongside `collectQuestionErrors` and follows the same visibility
 * rule: a question hidden by enable_when (or inside a hidden group) is
 * not on the canvas and gets no error — the studio refuses to save an
 * action that references one, so that case never reaches a form.
 */
export function collectActionReferenceErrors(
  questionnaire: QuestionnaireRead,
  responses: Record<string, QuestionnaireResponse>,
  t: TFunction,
): QuestionValidationError[] {
  const actions = questionnaire.actions ?? [];
  if (actions.length === 0) return [];
  const referenced = new Set(actions.flatMap(actionReferencedLinkIds));
  if (referenced.size === 0) return [];

  const linkIndex = buildLinkIndex(questionnaire.questions);
  const errors: QuestionValidationError[] = [];
  const walk = (
    questions: Question[],
    ancestorsEnabled: boolean,
    scope: Record<string, QuestionnaireResponse>,
    path: ResponsePath,
  ) => {
    for (const question of questions) {
      const enabled =
        ancestorsEnabled &&
        isQuestionEnabledInState(question, scope, linkIndex);
      if (
        enabled &&
        question.type !== "group" &&
        referenced.has(question.link_id) &&
        !scope[question.id]?.values?.some(entryIsAnswered)
      ) {
        errors.push({
          question_id: question.id,
          ...(path.length ? { response_path: path } : {}),
          error: t("action_reference_required"),
        });
      }
      if (question.type === "group" && question.repeats) {
        (scope[question.id]?.sub_results ?? []).forEach((row, rowIndex) =>
          walk(
            question.questions ?? [],
            enabled,
            { ...scope, ...responseMap(row) },
            [...path, { questionId: question.id, rowIndex }],
          ),
        );
      } else walk(question.questions ?? [], enabled, scope, path);
    }
  };
  walk(questionnaire.questions, true, responses, []);
  return errors;
}
