import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";
import type { ResolvedStructuredType } from "@/components/QuestionnaireV2/structured/registry";
import {
  resolveStructuredSlotState,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";

import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";
import {
  isPatientBound,
  rendererSubjectOf,
  subjectResourceId,
} from "@/components/QuestionnaireV2/fill/subject";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { serializeResponseValues } from "./serializeValues";

/**
 * A structured type's `buildRequests` threw or rejected.
 *
 * `buildRequests` is third-party code for plugin types, and the submit
 * callback is fired as `void submit()` — an unguarded rejection travelled
 * through `Promise.all` and became an unhandled promise rejection, turning
 * Save Changes into a silent no-op that blocked EVERY form in the session
 * with no toast, no panel and no batch. The host catches this and pins the
 * failure to the question that produced it, exactly as `invokeAction`
 * contains a thrown plugin action.
 */
export class StructuredBuildError extends Error {
  readonly questionId: string;

  constructor(questionId: string, cause: unknown) {
    super(`buildRequests failed for structured question ${questionId}`, {
      cause,
    });
    this.name = "StructuredBuildError";
    this.questionId = questionId;
  }
}

/** `definition.buildRequests` behind the containment boundary — a
 *  synchronous throw and a rejected promise both become one
 *  `StructuredBuildError`. */
async function buildStructuredRequests(
  definition: ResolvedStructuredType,
  data: unknown[],
  context: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  try {
    return await definition.buildRequests(data, context);
  } catch (error) {
    throw new StructuredBuildError(context.questionId, error);
  }
}

export interface ComposeBatchArgs {
  questionnaire: QuestionnaireRead;
  responses: Record<string, QuestionnaireResponse>;
  subject: FillSubject;
  /** Question ids whose structured slot threw and shows the error
   *  boundary's notice (`structuredRenderFailedAtom`). The validators skip
   *  these on the premise that their data never submits — this is the
   *  compose half of that bargain. Without it, rows recorded BEFORE the
   *  component broke would post to the domain APIs with their type's
   *  `validate` never run, from a section the UI presents as inert. */
  renderFailed?: ReadonlySet<string>;
  /** Resuming a server draft — appends the completion PUT. */
  continueDraftId?: string;
}

/**
 * Assemble the one-batch submission (legacy handleSubmit semantics, from
 * the v2 store): structured answers become raw domain-API requests via
 * each type's `buildRequests` (core types are patient-bound by
 * construction — the legacy gate; plugin types may declare a resource
 * subject and run there too), plain answers POST to
 * `/questionnaire/{id}/submit/` for patient-bound subjects and
 * `/questionnaire/{id}/submit_resource/` for resource subjects
 * (location/device/facility, which have no patient to record against),
 * and a resumed server draft gets its completion PUT (patient-bound
 * only). Only questions currently enabled by enable_when contribute —
 * same resolution rendering uses.
 *
 * Pure with respect to UI state: everything it needs arrives as
 * arguments, so it is directly exercisable without mounting anything.
 *
 * Two deliberate divergences from legacy, both in service of "what you see
 * is what submits":
 * 1. The walk skips the entire subtree of a disabled group (the renderer
 *    never shows those questions), while legacy re-checked only each
 *    leaf's own conditions and could submit answers recorded under a
 *    since-disabled group.
 * 2. `isEnabled` applies to STRUCTURED leaves too. Legacy checked nothing
 *    at submit time for structured questions — it iterated the recorded
 *    responses directly — so data entered while a structured question was
 *    enabled still submitted after its OWN enable_when later turned false.
 *    Here it does not: flipping the controlling answer takes the section
 *    off the canvas and out of the batch together.
 */
export async function composeBatch({
  questionnaire,
  responses,
  subject,
  renderFailed,
  continueDraftId,
}: ComposeBatchArgs): Promise<StructuredBatchEntry[]> {
  // Narrowed once, up front: the structured leg and the draft PUT both
  // need the patient ids, and a closure cannot carry the narrowing.
  const patientBound = isPatientBound(subject) ? subject : undefined;
  const renderCtx = rendererSubjectOf(subject);
  const linkIndex = buildLinkIndex(questionnaire.questions);
  const isEnabled = (question: Question) =>
    isQuestionEnabledInState(question, responses, linkIndex);

  const requests: StructuredBatchEntry[] = [];
  const structuredWork: Promise<StructuredBatchEntry[]>[] = [];
  const answeredLeaves: QuestionnaireResponse[] = [];

  const walk = (questions: Question[]) => {
    for (const question of questions) {
      if (!isEnabled(question)) continue;
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      const response = responses[question.id];
      if (!response) continue;

      if (question.type === "structured" && question.structured_type) {
        // The slot's component threw — the clinician sees a notice, not
        // their data, and validateStructured skipped this question's
        // `validate` for the same reason. What the UI shows as inert must
        // not submit behind its back.
        if (renderFailed?.has(question.id)) continue;
        // The recorded entries must belong to this question's type — the
        // guard `structuredDataOf` used to carry, kept now that the data
        // read is untyped.
        if (response.structured_type !== question.structured_type) continue;
        // The same slot-state predicate the renderer (`StructuredSlot`) and
        // both submit-time validators (`form/validation.ts`,
        // `fill/submit/validateStructured.ts`) read — `unknown_type`
        // (plugin disabled), `subject_mismatch` (a type authored onto a
        // questionnaire whose subject_type it doesn't declare — legacy
        // data; the studio picker now prevents this going forward), and
        // `missing_context` all skip here. The last is the fix: draft-
        // restored data under a slot whose required context id the mount
        // can't supply used to reach `buildRequests` with an undefined
        // patient/encounter/facility id.
        const state = resolveStructuredSlotState(
          question.structured_type,
          questionnaire.subject_type,
          renderCtx,
        );
        if (state.kind !== "ready") continue;
        const definition = state.definition;
        // Core types are patient-bound by construction (every core
        // `subjects` list is patient and/or encounter, and every core
        // request hangs off a patient id) — that is the legacy gate. A
        // PLUGIN type may declare a resource subject; the studio offers it
        // there, the slot renders it and validateStructured runs its
        // validate, so dropping its requests here would render, validate
        // and then silently discard the clinician's data. Slot state
        // alone doesn't encode this distinction — it reads the
        // QUESTIONNAIRE's declared subject_type, not the session's
        // runtime subject — so the explicit gate stays on top of it.
        if (!patientBound && definition.source !== "plugin") continue;
        const data = structuredDataAny(response);
        if (data.length === 0) continue;
        structuredWork.push(
          buildStructuredRequests(definition, data, {
            patientId: patientBound?.patientId,
            encounterId: renderCtx.encounterId,
            facilityId: renderCtx.facilityId,
            questionId: question.id,
          }),
        );
        continue;
      }

      // Every plain leaf goes through serialization; the content decision
      // is `serializeResponseValues`' alone (its filter keeps value-,
      // coding- and unit-carrying entries). Gating here on values[0]
      // dropped a repeats answer wholesale when its FIRST row was cleared
      // in place — later rows silently never submitted, while the
      // required check (which scans every entry) reported the question
      // answered.
      if (!response.structured_type) {
        answeredLeaves.push(response);
      }
    }
  };
  walk(questionnaire.questions);

  // Structured requests first — same ordering as the legacy batch.
  for (const entries of await Promise.all(structuredWork)) {
    requests.push(...entries);
  }

  const results = answeredLeaves
    .map((response) => ({
      question_id: response.question_id,
      values: serializeResponseValues(response.values),
      note: response.note,
      body_site: response.body_site,
      method: response.method,
    }))
    // Every entry turned out content-free (a repeats row cleared in place
    // leaves `value: undefined` at its index) — there is nothing to record
    // for this question, and an empty `values` is a server error rather
    // than an omission.
    .filter((result) => result.values.length > 0);

  if (results.length > 0) {
    requests.push(
      patientBound
        ? {
            url: `/api/v1/questionnaire/${questionnaire.id}/submit/`,
            method: "POST",
            reference_id: questionnaire.id,
            body: {
              resource_id: subjectResourceId(subject),
              encounter: renderCtx.encounterId,
              patient: patientBound.patientId,
              results,
              // Links this submission to the resumed server draft so the
              // backend's duplicate-submission guard (keyed off
              // `form_submission`) catches a second tab completing the
              // same draft concurrently. The completion PUT below still
              // runs alongside this — the backend doesn't flip the
              // draft's status server-side yet.
              ...(continueDraftId ? { form_submission: continueDraftId } : {}),
            },
          }
        : {
            // Resource subjects have neither patient nor encounter — the
            // backend records the response against `resource_id` alone.
            url: `/api/v1/questionnaire/${questionnaire.id}/submit_resource/`,
            method: "POST",
            reference_id: questionnaire.id,
            body: { resource_id: subjectResourceId(subject), results },
          },
    );
  }

  // Server drafts are patient/encounter form_submission records — there is
  // no resource-subject equivalent to complete.
  if (continueDraftId && patientBound) {
    // Shape-compatible with the legacy draft dump: restore reads
    // response_dump.questionnaireResponses.{questionnaire,responses}.
    requests.push({
      url: `/api/v1/form_submission/${continueDraftId}/`,
      method: "PUT",
      reference_id: `form_submission_${continueDraftId}`,
      body: {
        patient: patientBound.patientId,
        encounter: renderCtx.encounterId,
        status: "submitted",
        response_dump: {
          questionnaireResponses: {
            questionnaire,
            responses: Object.values(responses),
            errors: [],
          },
        },
      },
    });
  }

  return requests;
}
