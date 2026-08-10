import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";

export type { TimeOfDeathRow };

/** `useStructuredSingleRow` with no baseline needs a complete row to record
 *  an `add` against — `patch` is always the whole row. */
export function createSeed(): TimeOfDeathRow {
  return { deceased_datetime: "" };
}

/** The single authority on "empty" for this row shape — `projectValues`
 *  and `toRequests` both defer to it so projection and wire agree. */
export function isEmptyRow(row: TimeOfDeathRow): boolean {
  return !row.deceased_datetime;
}

/** Module scope — `useStructuredRows` memoizes on this identity; an inline
 *  arrow would rewrite the projection on every render. Filters with the
 *  SAME `isEmptyRow` the differ uses, so the two agree by construction: a
 *  blank row (reachable via a restored or externally edited draft — drafts are
 *  shape-validated, never patch-validated) is unanswered everywhere, not
 *  just on the wire. Projecting it would light the outline tick and
 *  satisfy required validation while `toRequests` silently sent nothing. */
export const projectValues: ProjectValues<TimeOfDeathRow> = (rows) => {
  const answered = rows.filter((row) => !isEmptyRow(row));
  return answered.length === 0
    ? []
    : [{ type: "time_of_death", value: answered }];
};

export async function toRequests(
  edits: readonly StructuredEdit<TimeOfDeathRow>[],
  { patientId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  // `subjects` is patient/encounter, so a patient is in scope in practice;
  // narrowed rather than asserted because the context type is optional for
  // plugin types on a resource subject.
  if (!patientId) return [];
  // `removes` is ignored: no delete endpoint and no soft-delete marker —
  // the editor's add-then-clear annihilates in the log, so a surviving
  // `remove` can only be a malformed draft's stray edit.
  const { creates, updates } = resolveChanges(edits, {});
  // Singleton: collapse to AT MOST ONE request — a malformed draft could
  // carry two rowIds, and this must never PUT the same patient endpoint
  // twice in one batch. Blanks are filtered OUT before taking the last
  // entry so whatever `projectValues` shows as the answered row is exactly
  // what this differ sends. NOT log order, despite `[...creates,
  // ...updates]` reading like it: `resolveChanges` groups by set, so
  // `.at(-1)` picks the last UPDATE if any exist, else the last CREATE —
  // harmless for a well-formed one-rowId log, arbitrary-but-deterministic
  // for a malformed one.
  const row = [...creates, ...updates].filter((r) => !isEmptyRow(r)).at(-1);
  if (!row) return [];
  return [
    {
      url: `/api/v1/patient/${patientId}/`,
      method: "PUT" as const,
      body: { deceased_datetime: row.deceased_datetime },
      reference_id: structuredReferenceId("time_of_death", questionId),
    },
  ];
}
