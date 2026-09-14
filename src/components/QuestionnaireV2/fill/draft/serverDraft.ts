import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { DroppedDraftAnswer } from "./draftMerge";
import { mergeDraftResponses } from "./draftMerge";
import { reviveDraftResponses } from "./fillDraftCore";

export type ServerDraftState =
  | { mismatch: true }
  | {
      mismatch: false;
      responses: Record<string, QuestionnaireResponse>;
      /** Stored answers the CURRENT questionnaire can no longer carry —
       *  named for the clinician, never dropped silently. */
      dropped: DroppedDraftAnswer[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validate and extract a resumed server draft (`?continue_draft=`).
 * `response_dump` is a free-form JSON blob the server never validates, so its
 * shape is checked at runtime instead of trusted with a cast: a malformed dump
 * lands on the "draft not recoverable" branch rather than surfacing as crashes
 * deep in the renderer.
 *
 * The extracted record goes through the SAME compatibility layer as a local
 * draft: the questionnaire may have been re-authored since the draft was
 * saved, and an answer whose question was removed or retyped must be named
 * rather than silently dropped by the provider's seed (or, worse, carried in a
 * stale shape into the submit batch).
 */
export function parseServerDraft(
  serverDraft: Pick<FormSubmissionRead, "status" | "response_dump">,
  questionnaire: Pick<QuestionnaireRead, "id" | "questions">,
): ServerDraftState {
  // Only an open draft resumes. A record already submitted (or marked
  // entered-in-error) re-opening as editable would let one submission
  // file twice — the overview's drafts card filters these out, but the
  // URL is shareable and outlives that filter.
  if (serverDraft.status !== "draft") {
    return { mismatch: true };
  }
  const dump: unknown = serverDraft.response_dump;
  const form = isRecord(dump) ? dump.questionnaireResponses : undefined;
  if (
    !isRecord(form) ||
    !isRecord(form.questionnaire) ||
    form.questionnaire.id !== questionnaire.id ||
    !Array.isArray(form.responses)
  ) {
    return { mismatch: true };
  }
  const record: Record<string, QuestionnaireResponse> = {};
  // The clone is load-bearing: these entries belong to the TanStack Query
  // cache (the same record a re-save PUTs back), and `reviveDraftResponses`
  // rewrites entry values IN PLACE.
  for (const item of structuredClone(form.responses) as unknown[]) {
    if (!isRecord(item) || typeof item.question_id !== "string") {
      return { mismatch: true };
    }
    // Beyond `question_id` the entry is trusted as a QuestionnaireResponse
    // this page's own save path wrote; `reviveDraftResponses` defends the
    // date fields it touches and the merge below defends the rest.
    record[item.question_id] = item as unknown as QuestionnaireResponse;
  }
  const { responses, dropped } = mergeDraftResponses(
    questionnaire.questions,
    reviveDraftResponses(record),
  );
  return { mismatch: false, responses, dropped };
}
