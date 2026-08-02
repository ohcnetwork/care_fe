import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/renderer/store";
import {
  resolveStructuredType,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";
import type { StructuredBatchEntry } from "@/components/QuestionnaireV2/structured/types";

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

export interface ComposeBatchArgs {
  questionnaire: QuestionnaireRead;
  responses: Record<string, QuestionnaireResponse>;
  subject: FillSubject;
  /** Resuming a server draft — appends the completion PUT. */
  continueDraftId?: string;
}

/**
 * Assemble the one-batch submission (legacy handleSubmit semantics, from
 * the v2 store): structured answers become raw domain-API requests via
 * each type's `buildRequests` (patient-bound fills only — the legacy
 * gate), plain answers POST to `/questionnaire/{id}/submit/` for
 * patient-bound subjects and `/questionnaire/{id}/submit_resource/` for
 * resource subjects (location/device/facility, which have no patient to
 * record against), and a resumed server draft gets its completion PUT
 * (patient-bound only). Only questions currently
 * enabled by enable_when contribute — same resolution rendering uses.
 *
 * Pure with respect to UI state: everything it needs arrives as
 * arguments, so it is directly exercisable without mounting anything.
 *
 * One deliberate divergence from legacy: the walk skips the entire
 * subtree of a disabled group (the renderer never shows those questions),
 * while legacy re-checked only each leaf's own conditions and could
 * submit answers recorded under a since-disabled group. What you see is
 * what submits.
 */
export async function composeBatch({
  questionnaire,
  responses,
  subject,
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
        // The whole structured leg only runs for a patient-bound fill.
        if (!patientBound) continue;
        // The recorded entries must belong to this question's type — the
        // guard `structuredDataOf` used to carry, kept now that the data
        // read is untyped.
        if (response.structured_type !== question.structured_type) continue;
        const definition = resolveStructuredType(question.structured_type);
        // A type this deployment doesn't have (plugin disabled) has no
        // endpoint to post to — skip it; validateStructured is what tells
        // the clinician, and only when the question was required.
        if (!definition) continue;
        // A type authored onto a questionnaire whose subject_type it
        // doesn't declare (legacy data — the studio picker now prevents
        // this going forward) never reaches the domain API.
        if (!definition.subjects.includes(questionnaire.subject_type)) {
          continue;
        }
        const data = structuredDataAny(response);
        if (data.length === 0) continue;
        structuredWork.push(
          definition.buildRequests(data, {
            patientId: patientBound.patientId,
            encounterId: renderCtx.encounterId,
            facilityId: renderCtx.facilityId,
            questionId: question.id,
          }),
        );
        continue;
      }

      if (
        response.values.length > 0 &&
        response.values[0]?.value !== "" &&
        !response.structured_type
      ) {
        answeredLeaves.push(response);
      }
    }
  };
  walk(questionnaire.questions);

  // Structured requests first — same ordering as the legacy batch.
  for (const entries of await Promise.all(structuredWork)) {
    requests.push(...entries);
  }

  if (answeredLeaves.length > 0) {
    const results = answeredLeaves.map((response) => ({
      question_id: response.question_id,
      values: serializeResponseValues(response.values),
      note: response.note,
      body_site: response.body_site,
      method: response.method,
    }));
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
