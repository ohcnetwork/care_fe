import type { TFunction } from "i18next";

import { entryIsAnswered } from "@/components/QuestionnaireV2/form/engine/inputs/answeredEntry";
import { responseMap } from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  buildLinkIndex,
  isQuestionEnabledInState,
  renderFailedKey,
} from "@/components/QuestionnaireV2/form/engine/store";
import { getQuestionGroup } from "@/components/QuestionnaireV2/groups/registry";
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

/** Where the questionnaire is being filled — what decides whether a
 *  structured question's slot can show an input at all. */
export interface QuestionValidationContext {
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
  context: QuestionValidationContext,
): boolean {
  if (context.renderFailed.has(renderFailedKey(questionId, path))) return false;
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
 * required-invalid; a response counts as answered when any of its entries
 * does, by the same `entryIsAnswered` rule the submit serializer filters on.
 */
export function collectQuestionErrors(
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  t: TFunction,
  context: QuestionValidationContext,
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
        const definition = question.structured_type
          ? getQuestionGroup(question.structured_type)
          : undefined;
        if (
          definition?.validate &&
          definition.subjects.includes(context.questionnaire.subject_type)
        ) {
          try {
            errors.push(...definition.validate(question, scope, path));
          } catch {
            errors.push({
              question_id: question.id,
              response_path: path,
              error: t("registered_group_validation_failed"),
            });
          }
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
