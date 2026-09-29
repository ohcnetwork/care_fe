import type { TFunction } from "i18next";

import { entryIsAnswered } from "@/components/QuestionnaireV2/form/engine/inputs/answeredEntry";
import { responseMap } from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  buildLinkIndex,
  isQuestionEnabledInState,
  renderFailedKey,
} from "@/components/QuestionnaireV2/form/engine/store";
import { groupsNeedingSchemaUpdate } from "@/components/QuestionnaireV2/groups/schema";
import { resolveStructuredSlotState } from "@/components/QuestionnaireV2/structured/registry";

import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

export interface RequiredCheckContext {
  questionnaire: QuestionnaireRead;
  subject: RendererSubject;
  /** `structuredRenderFailedAtom`: slots showing the error boundary's notice. */
  renderFailed: ReadonlySet<string>;
}

/** A slot showing a notice instead of an input cannot be answered; the
 *  structured validator reports those by name, so the generic required
 *  check stays out of the way. */
function structuredQuestionIsAnswerable(
  structuredType: string,
  questionId: string,
  path: ResponsePath,
  context: RequiredCheckContext,
): boolean {
  if (context.renderFailed.has(renderFailedKey(questionId, path))) return false;
  const state = resolveStructuredSlotState(
    structuredType,
    context.questionnaire.subject_type,
    context.subject,
  );
  return state.kind === "ready";
}

/** Required-field errors for every enabled question, by the same
 *  `entryIsAnswered` rule the submit serializer filters on. */
export function collectRequiredErrors(
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  t: TFunction,
  context: RequiredCheckContext,
): QuestionValidationError[] {
  const linkIndex = buildLinkIndex(questions);

  const errors: QuestionValidationError[] = [];
  const walk = (
    list: Question[],
    scope: Record<string, QuestionnaireResponse>,
    path: ResponsePath,
  ) => {
    for (const question of list) {
      if (!isQuestionEnabledInState(question, responses, linkIndex)) continue;
      if (question.type === "group") {
        if (
          groupsNeedingSchemaUpdate(
            [question],
            (candidate) => candidate.id === question.id,
          ).length
        ) {
          errors.push({
            question_id: question.id,
            response_path: path,
            error: t("registered_group_schema_update_required"),
          });
          continue;
        }
        if (question.repeats) {
          const rows = scope[question.id]?.sub_results ?? [];
          if (question.required && !rows.length)
            errors.push({
              question_id: question.id,
              response_path: path,
              error: t("field_required"),
            });
          rows.forEach((row, rowIndex) =>
            walk(question.questions ?? [], responseMap(row), [
              ...path,
              { questionId: question.id, rowIndex },
            ]),
          );
        } else {
          walk(question.questions ?? [], scope, path);
        }
        continue;
      }
      if (question.type === "display" || !question.required) continue;
      if (
        question.structured_type &&
        !structuredQuestionIsAnswerable(
          question.structured_type,
          question.id,
          path,
          context,
        )
      ) {
        continue;
      }
      const values = scope[question.id]?.values ?? [];
      const answered = values.some(entryIsAnswered);
      if (!answered) {
        errors.push({
          question_id: question.id,
          ...(path.length ? { response_path: path } : {}),
          error: t("field_required"),
        });
      }
    }
  };
  walk(questions, responses, []);
  return errors;
}
