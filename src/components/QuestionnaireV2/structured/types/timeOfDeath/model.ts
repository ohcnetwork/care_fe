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

/** `mode: "single"` with no baseline needs a complete row to record an
 *  `add` against — `patch` is always the whole row. */
export function createSeed(): TimeOfDeathRow {
  return { deceased_datetime: "" };
}

/** The single authority on "empty" for this row shape. `projectValues` and
 *  `toRequests` below both defer to this — see `projectValues`'s doc
 *  comment for the bug that shipped when they each judged emptiness their
 *  own way instead. */
export function isEmptyRow(row: TimeOfDeathRow): boolean {
  return !row.deceased_datetime;
}

/** Module scope — `useStructuredRows` memoizes on this identity, and an
 *  inline arrow would rewrite the projection on every render (annex
 *  `p1-state-core.md` §18, "Risk — projection write loop").
 *
 *  POST-REVIEW FIX — projection and differ must agree on "empty". This
 *  used to project EVERY row regardless of content, while `toRequests`
 *  filtered on `isEmptyRow`. A hand-edited/restored draft carrying
 *  `{deceased_datetime: ""}` (the reducer's own `isEmptyRow` guard only
 *  stops a live `setRow` call from recording that edit — it does not
 *  validate `patch` on an already-stored or restored edit, which is
 *  deliberate: untrusted drafts are never patch-validated, only shape-
 *  validated by `isStructuredEditRecord`) then projected as an ANSWERED
 *  entry — `entryHasContent` reads a non-empty `values[0].value` array and
 *  is true — which lit the outline tick and satisfied required validation,
 *  while `toRequests` silently sent nothing. Filtering here with the SAME
 *  `isEmptyRow` the differ uses makes the two agree by construction: a
 *  blank row is unanswered everywhere, not just on the wire. The editor
 *  renders from `single.row` (`useStructuredRows`'s own projection of
 *  `(baseline, edits)`), never from this function's output, so nothing
 *  user-visible about the live input changes. */
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
  // `removes` is intentionally ignored: time_of_death has no soft-delete
  // marker and no delete endpoint (nothing is passed as `options.softDelete`
  // above), so a `remove` entry here can only be a malformed/restored
  // draft's stray edit — the ordinary add-then-clear path in the editor
  // annihilates the pair in the log before it ever reaches a differ
  // (`editLog.ts`'s `coalesceOntoRemove`) — and there is no request this
  // create/update-only PUT endpoint could send for one anyway.
  const { creates, updates } = resolveChanges(edits, {});
  // Singleton: collapse to AT MOST ONE request. `resolveChanges` dispatches
  // once per distinct `rowId`, and the live reducer only ever uses
  // `SINGLETON_ROW_ID`, but a malformed/restored draft could carry two
  // different rowIds for this type — take the LAST (log order), never PUT
  // the same patient endpoint twice in one batch.
  const row = [...creates, ...updates].at(-1);
  if (!row || isEmptyRow(row)) return [];
  return [
    {
      url: `/api/v1/patient/${patientId}/`,
      method: "PUT" as const,
      body: { deceased_datetime: row.deceased_datetime },
      reference_id: structuredReferenceId("time_of_death", questionId),
    },
  ];
}
