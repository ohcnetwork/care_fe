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
 * Submit-time structured validation, and the ONE place that decides
 * whether a broken structured slot blocks the submit.
 *
 * Every enabled structured question resolves the same slot state
 * `StructuredSlot` renders from (plus the render-failed set its error
 * boundary writes) — the shared resolver documented on
 * `StructuredSlotState`. Whatever that comes back with other than `ready`
 * means the clinician has no input to answer: an unknown/disabled type, a
 * subject the type doesn't declare, a context id this mount can't supply,
 * or a component that threw. `composeBatch` drops that question's data
 * regardless of what's recorded, so the fork here is stark:
 *   - REQUIRED — the section is unusable but was supposed to be answered.
 *     Fail-open here would submit the rest of the form and quietly leave
 *     that section out, with a success toast telling the clinician nothing
 *     was wrong. So this hard-blocks, one error, naming the question by
 *     its own text (`structured_section_unavailable_required`) — the
 *     clinician learns exactly which section and that saving is impossible
 *     until it loads.
 *   - not required — the section was always optional; skipping it here
 *     matches `composeBatch` exactly, and `StructuredSlot`'s notice tells
 *     the clinician its entries won't be submitted.
 * `collectRequiredErrors` stays out of this decision entirely (it just
 * avoids double-erroring the same question — see its comment), so this is
 * the one and only source of a broken-slot error.
 *
 * A `ready` question still runs its type's `validate` (core and plugin
 * definitions alike). `t` is threaded the same way `collectRequiredErrors`
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
      // The recorded entries must belong to this question's type — the
      // guard `structuredDataOf` used to carry, kept now that the data
      // read is untyped.
      if (response?.structured_type !== type) continue;
      const data = structuredDataAny(response);
      if (data.length === 0) continue;
      // TEMPORARY CONTRACT-V2 STUB (Task 6 compile-compat, pending Task
      // 8): `definition.validate` now has an incompatible signature on
      // the v2 arm (projection + edits, not just data) — `resolved` is a
      // `contract`-discriminated union (`structured/registry.ts`), and no
      // core or plugin registration is contract 2 yet, so this is
      // unreachable today. Task 8 (design annex `p1-shim.md` §c.2) wires
      // the real two-argument call. The v1 path below is byte-identical
      // to the pre-Task-6 call.
      if (definition.contract === 2) continue;
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
