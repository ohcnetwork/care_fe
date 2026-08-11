import type { QuestionnaireResponse } from "@/types/questionnaire/form";

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
