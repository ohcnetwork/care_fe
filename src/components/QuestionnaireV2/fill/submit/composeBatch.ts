import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/renderer/store";
import {
  structuredDataOf,
  structuredDefinitionFor,
} from "@/components/QuestionnaireV2/structured/registry";
import type { StructuredBatchEntry } from "@/components/QuestionnaireV2/structured/types";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { serializeResponseValues } from "./serializeValues";

export interface ComposeBatchArgs {
  questionnaire: QuestionnaireRead;
  responses: Record<string, QuestionnaireResponse>;
  subject: {
    patientId?: string;
    encounterId?: string;
    facilityId?: string;
  };
  /** Resuming a server draft — appends the completion PUT. */
  continueDraftId?: string;
}

/**
 * Assemble the one-batch submission (legacy handleSubmit semantics, from
 * the v2 store): structured answers become raw domain-API requests via
 * each type's `buildRequests` (patient-bound fills only — the legacy
 * gate), plain answers POST to `/questionnaire/{id}/submit/`, and a
 * resumed server draft gets its completion PUT. Only questions currently
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
  const { patientId, encounterId, facilityId } = subject;
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
        if (!patientId) continue;
        const type = question.structured_type;
        const data = structuredDataOf(type, response);
        if (data.length === 0) continue;
        structuredWork.push(
          structuredDefinitionFor(type).buildRequests(data, {
            patientId,
            encounterId,
            facilityId,
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
    requests.push({
      url: `/api/v1/questionnaire/${questionnaire.id}/submit/`,
      method: "POST",
      reference_id: questionnaire.id,
      body: {
        resource_id: encounterId ? encounterId : patientId,
        encounter: encounterId,
        patient: patientId,
        results: answeredLeaves.map((response) => ({
          question_id: response.question_id,
          values: serializeResponseValues(response.values),
          note: response.note,
          body_site: response.body_site,
          method: response.method,
        })),
      },
    });
  }

  if (continueDraftId) {
    // Shape-compatible with the legacy draft dump: restore reads
    // response_dump.questionnaireResponses.{questionnaire,responses}.
    requests.push({
      url: `/api/v1/form_submission/${continueDraftId}/`,
      method: "PUT",
      reference_id: `form_submission_${continueDraftId}`,
      body: {
        patient: patientId,
        encounter: encounterId,
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
