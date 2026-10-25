import {
  resolveStructuredSlotState,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";
import type {
  StructuredBatchEntry,
  StructuredRequestBuilder,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";

import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";
import {
  isPatientBound,
  rendererSubjectOf,
} from "@/components/QuestionnaireV2/fill/subject";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { getQuestionGroup } from "@/components/QuestionnaireV2/groups/registry";
import { incompatibleGroupQuestions } from "@/components/QuestionnaireV2/groups/schema";
import { serializeQuestionResults } from "./serializeQuestionResults";
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
  buildRequests: StructuredRequestBuilder,
  data: unknown[],
  context: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  try {
    return await buildRequests(data, context);
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
 * domain-API requests via each type's `buildRequests`; plain answers POST to the patient-bound or
 * resource-subject questionnaire submit endpoint; a resumed server draft
 * also gets its completion PUT. Only questions currently enabled by
 * enable_when contribute, including structured leaves, and a disabled
 * group's subtree is skipped together with its parent.
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
  const requests: StructuredBatchEntry[] = [];
  const structuredAnswers = new Map<
    string,
    {
      buildRequests: StructuredRequestBuilder;
      data: unknown[];
      context: StructuredRequestContext;
    }
  >();
  const results = serializeQuestionResults(
    questionnaire.questions,
    responses,
    (question, response) => {
      if (question.type === "group" && question.structured_type) {
        const definition = getQuestionGroup(question.structured_type);
        if (
          definition &&
          incompatibleGroupQuestions(question, definition).length
        ) {
          throw new Error(
            "Registered group schema needs an editor update before submission",
          );
        }
      }
      if (
        question.type !== "structured" ||
        !question.structured_type ||
        !response
      )
        return;
      if (
        renderFailed?.has(question.id) ||
        response.structured_type !== question.structured_type
      )
        return;
      const state = resolveStructuredSlotState(
        question.structured_type,
        questionnaire.subject_type,
        renderCtx,
      );
      if (state.kind !== "ready" || !patientBound) return;
      const data = structuredDataAny(response);
      if (!data.length) return;
      const existing = structuredAnswers.get(question.id);
      if (existing) existing.data.push(...data);
      else
        structuredAnswers.set(question.id, {
          buildRequests: state.definition.buildRequests,
          data: [...data],
          context: {
            patientId: patientBound.patientId,
            encounterId: renderCtx.encounterId,
            facilityId: renderCtx.facilityId,
            questionId: question.id,
          },
        });
    },
  );

  // Structured requests first; domain mutations run before the questionnaire submit.
  for (const entries of await Promise.all(
    Array.from(structuredAnswers.values(), ({ buildRequests, data, context }) =>
      buildStructuredRequests(buildRequests, data, context),
    ),
  )) {
    requests.push(...entries);
  }

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
  // no resource-subject equivalent to complete. A draft with nothing left
  // to submit stays a draft, so the caller's empty-batch guard can fire.
  if (requests.length > 0 && continueDraftId && patientBound) {
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
