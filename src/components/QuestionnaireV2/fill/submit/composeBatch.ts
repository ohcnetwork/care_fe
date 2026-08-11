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
} from "@/components/QuestionnaireV2/fill/subject";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import type { SubmitResult } from "@/types/questionnaire/questionnaireApi";

import { serializeResponseValues } from "./serializeValues";
import { planPlainSubmit } from "./submitTarget";

/** Body of the completion PUT for a resumed server draft. Restore reads
 *  `response_dump.questionnaireResponses.{questionnaire,responses}`.
 *  `patient`/`encounter` ride along with the status flip; the backend
 *  route's documented type omits them, but this batch entry is hand-built. */
interface FormSubmissionCompletionBody {
  patient: string;
  encounter?: string;
  status: "submitted";
  response_dump: {
    questionnaireResponses: {
      questionnaire: QuestionnaireRead;
      responses: QuestionnaireResponse[];
      errors: never[];
    };
  };
}

/**
 * An encounter-subject questionnaire reached submit from a mount that has no
 * encounter — the patient route, which the fill page admits on purpose.
 *
 * The backend requires `encounter` for those, so this batch can never
 * succeed; thrown instead of composed so the clinician is told which
 * questionnaire is in the wrong place, before the atomic batch rolls back
 * everything they typed with a pydantic message that never mentions the URL.
 */
export class MissingEncounterError extends Error {
  readonly questionnaireTitle: string;

  constructor(questionnaireTitle: string) {
    super(
      `encounter-subject questionnaire "${questionnaireTitle}" has no encounter to submit against`,
    );
    this.name = "MissingEncounterError";
    this.questionnaireTitle = questionnaireTitle;
  }
}

/**
 * A structured type's `buildRequests` threw or rejected.
 *
 * `buildRequests` is third-party code for plugin types, and submit is fired
 * as `void submit()`. The host catches failures and pins them to the
 * question that produced them, preventing an unhandled rejection from
 * turning Save Changes into a silent no-op.
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
 *  `StructuredBuildError`, pinned to the question that produced it. */
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
 * Assemble the one-batch submission. Structured answers become raw
 * domain-API requests via each type's `buildRequests`; plain answers POST to
 * the patient-bound or resource-subject questionnaire submit endpoint; a
 * resumed server draft also gets its completion PUT. Only questions
 * currently enabled by enable_when contribute, including structured leaves,
 * and a disabled group's subtree is skipped together with its parent.
 *
 * Pure with respect to UI state: everything it needs arrives as arguments.
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
        // The recorded entries must belong to this question's type.
        if (response.structured_type !== question.structured_type) continue;
        // The same slot-state predicate the renderer (`StructuredSlot`) and
        // submit-time validators read. Unknown types, subject mismatches and
        // missing context all skip here; missing context prevents calling
        // `buildRequests` without the required ids.
        const state = resolveStructuredSlotState(
          question.structured_type,
          questionnaire.subject_type,
          renderCtx,
        );
        if (state.kind !== "ready") continue;
        const definition = state.definition;
        // Core types are patient-bound by construction: every core request
        // hangs off a patient id. A plugin type may declare a resource
        // subject; if the slot renders and validates there, its requests
        // must not be silently discarded. Slot state reads the
        // questionnaire's subject_type, not the session's runtime subject,
        // so the explicit runtime gate stays on top of it.
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

  // Structured requests first; domain mutations run before the questionnaire submit.
  for (const entries of await Promise.all(structuredWork)) {
    requests.push(...entries);
  }

  const results: SubmitResult[] = answeredLeaves
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
    // Endpoint and body come from the questionnaire's subject_type, not the
    // mount — see `planPlainSubmit`. `continueDraftId` links the submission
    // to the resumed server draft so the backend's duplicate-submission
    // guard (keyed off `form_submission`) catches a second tab completing
    // the same draft concurrently; the completion PUT below still runs
    // alongside it — the backend doesn't flip the draft's status
    // server-side yet.
    const plan = planPlainSubmit({
      questionnaireId: questionnaire.id,
      subjectType: questionnaire.subject_type,
      subject,
      results,
      continueDraftId,
    });
    if (plan.kind === "encounter_required") {
      throw new MissingEncounterError(questionnaire.title);
    }
    requests.push({
      url: plan.url,
      method: "POST",
      reference_id: questionnaire.id,
      body: plan.body,
    });
  }

  // Server drafts are patient/encounter form_submission records — there is
  // no resource-subject equivalent to complete.
  if (continueDraftId && patientBound) {
    const body: FormSubmissionCompletionBody = {
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
    };
    requests.push({
      url: `/api/v1/form_submission/${continueDraftId}/`,
      method: "PUT",
      reference_id: `form_submission_${continueDraftId}`,
      body,
    });
  }

  return requests;
}
