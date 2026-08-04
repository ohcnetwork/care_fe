import type { ResponseValue } from "@/types/questionnaire/form";
import type {
  StructuredEdit,
  StructuredEditRecord,
} from "@/types/questionnaire/structured";

/** Stable, client-owned identity for one structured row. */
export type RowId = string;

/**
 * One server row as the query layer handed it over, already converted to
 * the shape the editor edits, and already keyed. The type module's
 * converter produces these; the hook never fetches and never guesses ids.
 */
export interface BaselineRow<TRow extends object> {
  rowId: RowId;
  row: TRow;
}

/**
 * One user-intent record — a `TRow`-typed alias of Task 1's SHIPPED
 * vocabulary (`StructuredEdit<TRow>`, `src/types/questionnaire/
 * structured.ts:99-106`), not a restatement of it. Aliasing rather than
 * restating is what keeps the two from drifting apart again: an earlier
 * draft of this file defined its own discriminated union (`row_id`
 * snake_case, `Partial<TRow>` on `update`, no `patch` at all on `remove`)
 * that was NOT what Task 1 shipped and was not structurally assignable to
 * `StructuredEditRecord` — caught in review (see task-2-report.md's "fix
 * commit" section) and fixed here by aliasing instead of shadowing.
 *
 * The canonical shape, restated only for readability: `{ rowId: string;
 * op: "add" | "update" | "remove"; patch: TRow }`. `patch` is ALWAYS the
 * COMPLETE row — for every op, including `remove` — never a partial diff
 * and never absent. That is what lets a differ's `toRequests(edits, ctx)`
 * be genuinely self-sufficient: `composeBatch` stays a pure function with
 * no access to the TanStack cache, and a draft restored after a failed
 * baseline fetch still carries everything a submit needs. A patchless
 * `remove` could not do that — there would be nothing left to build an
 * entered-in-error soft-delete body from.
 */
export type RowEdit<TRow extends object> = StructuredEdit<TRow>;

export type EditLog<TRow extends object> = readonly RowEdit<TRow>[];

/** One row as the editor renders it: baseline merged with its edit. */
export interface ProjectedRow<TRow extends object> {
  rowId: RowId;
  row: TRow;
  /**
   * `"baseline"` — came from the server this session (possibly patched).
   * `"added"` — created here. This replaces every legacy `!!row.id` /
   * `isExistingRecord` check: a historical row re-added through
   * `HistoricalRecordSelector` has its id stripped
   * (`SymptomQuestion.tsx:786`) and is genuinely new.
   */
  origin: "baseline" | "added";
  /** This row has a recorded edit — drives "modified" affordances only. */
  edited: boolean;
  /** `softDelete.isDeleted(row)` — the entered-in-error presentation. */
  softDeleted: boolean;
}

/**
 * How a type expresses "remove" for a row the server already has. Every
 * clinical list type marks rather than deletes; the marker is an ordinary
 * field, so un-removing is an ordinary update (the legacy verification
 * select can already set it back — `SymptomQuestion.tsx:595-601`).
 */
export interface SoftDeleteDescriptor<TRow extends object> {
  /** Written onto the row when `removeRow` hits a baseline row. */
  patch: Partial<TRow>;
  /** Does the row already carry the marker? */
  isDeleted: (row: TRow) => boolean;
}

/** What a v2 differ/validator receives. */
export interface StructuredEditInputFor<TRow extends object> {
  edits: EditLog<TRow>;
  /** `values[0].value` — full row content for every edited row. */
  projection: readonly TRow[];
}

/**
 * The same, unnarrowed — what host-side (plugin-capable) code holds: the
 * type erasure of `StructuredEditInputFor<TRow>`, genuinely, not just in
 * name. Because `RowEdit<TRow>` is now literally `StructuredEdit<TRow>`
 * (see above), `EditLog<TRow>` (`readonly StructuredEdit<TRow>[]`) is
 * structurally assignable to `readonly StructuredEditRecord[]`
 * (`readonly StructuredEdit<unknown>[]`) for every `TRow` — the same
 * widening `StructuredEditInputFor<TRow>.projection` (`readonly TRow[]`)
 * already does to `readonly unknown[]` below. Compiler-checked by an
 * assignment in `core/deepEqual.test.ts` ("RowEdit / StructuredEditInput —
 * vocabulary parity with Task 1"), not merely asserted in this comment.
 *
 * No `src/types/questionnaire/edits.ts` module exists, and none should:
 * the design annex (`docs/superpowers/specs/annexes/p1-state-core.md`
 * §2.1/§2.2) assumed a sibling `StructuredEditLog` type there, but Task 1
 * (`.superpowers/sdd/task-1-report.md`) shipped the equivalent type-erased
 * vocabulary as `StructuredEditRecord` on `src/types/questionnaire/
 * structured.ts` instead. `StructuredEditRecord` is used here as the
 * canonical, actually-landed form.
 */
export interface StructuredEditInput {
  edits: readonly StructuredEditRecord[];
  projection: readonly unknown[];
}

export type ProjectValues<TRow extends object> = (
  rows: readonly TRow[],
) => ResponseValue[];
