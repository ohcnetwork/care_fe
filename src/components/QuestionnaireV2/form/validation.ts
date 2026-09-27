import type { TFunction } from "i18next";

import { entryIsAnswered } from "@/components/QuestionnaireV2/form/engine/inputs/answeredEntry";
import { responseMap } from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  buildLinkIndex,
  isQuestionEnabledInState,
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
 * Whether this structured question can accept an answer on this mount.
 * Broken slots are handled by structured-specific validation so the generic
 * required check does not stack a second, vaguer required error.
 */
function structuredQuestionIsAnswerable(
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
 * Only questions that are currently enabled and record answers can be
 * required-invalid; a response counts as answered when any of its entries
 * does, by the same `entryIsAnswered` rule the submit serializer filters on.
 */
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
      if (!isQuestionEnabledInState(question, scope, linkIndex)) continue;
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
            walk(question.questions ?? [], { ...scope, ...responseMap(row) }, [
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
