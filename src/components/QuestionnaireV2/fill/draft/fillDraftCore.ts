import type { QuestionnaireResponse } from "@/types/questionnaire/form";

export const FILL_DRAFT_SCHEMA_VERSION = 2;

export interface FillDraftScope {
  userId: string;
  subjectKey: string;
  entryQuestionnaireId: string;
  /** Query context that changes which record the structured widgets edit. */
  contextKey?: string;
}

export function fillDraftScopeKey(scope: FillDraftScope): string {
  const base = `${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`;
  return scope.contextKey
    ? `${base}--context=${encodeURIComponent(scope.contextKey)}`
    : base;
}

// This module must stay free of `structured/registry` (directly or
// transitively): `serverDraft.test.ts` runs under plain `node --test`, and
// the registry pulls every core definition's component tree.

/** JSON round-trips Dates to ISO strings; date/dateTime entries revive to
 *  Date objects so the inputs' discriminant checks keep working. Shared by
 *  the local-draft store and the server-draft (`?continue_draft=`) restore
 *  path, whose dump went through the same JSON flattening. */
export function reviveDraftResponses(
  responses: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  for (const response of Object.values(responses)) {
    for (const row of response.sub_results ?? []) {
      reviveDraftResponses(
        Object.fromEntries(row.map((entry) => [entry.question_id, entry])),
      );
    }
    // Server dumps are untyped blobs — a `values`-less entry is possible
    // and must not throw the whole encounter overview.
    for (const entry of response.values ?? []) {
      // Fresh from JSON.parse the declared Date is actually a string —
      // read through `unknown` at this one boundary.
      const raw = (entry as { value?: unknown }).value;
      if (
        (entry.type === "date" || entry.type === "dateTime") &&
        typeof raw === "string"
      ) {
        const revived = new Date(raw);
        entry.value = isNaN(revived.getTime()) ? undefined : revived;
      }
    }
  }
  return responses;
}

/** Validate nested draft rows before any restore path walks their answers. */
export function isDraftResponse(
  value: unknown,
): value is QuestionnaireResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const response = value as Record<string, unknown>;
  const isValues = (values: unknown) =>
    Array.isArray(values) &&
    values.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.type === "string" &&
        entry.type.length > 0,
    );
  return (
    typeof response.question_id === "string" &&
    response.question_id.length > 0 &&
    typeof response.link_id === "string" &&
    (response.structured_type === null ||
      (typeof response.structured_type === "string" &&
        response.structured_type.length > 0)) &&
    isValues(response.values) &&
    (response.note === undefined || typeof response.note === "string") &&
    (response.draft_context === undefined ||
      isValues(response.draft_context)) &&
    (response.sub_results === undefined ||
      (Array.isArray(response.sub_results) &&
        response.sub_results.every(
          (row) =>
            Array.isArray(row) &&
            row.every(isDraftResponse) &&
            new Set(row.map((entry) => entry.question_id)).size === row.length,
        )))
  );
}
