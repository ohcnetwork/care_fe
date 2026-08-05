import type { ResponseValue } from "@/types/questionnaire/form";
import type { StructuredEdit } from "@/types/questionnaire/structured";

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
 * One user-intent record — a `TRow`-typed alias of the shipped vocabulary
 * (`StructuredEdit<TRow>`, `src/types/questionnaire/structured.ts`), not a
 * restatement: aliasing is what keeps the two from drifting apart.
 *
 * Shape: `{ rowId: string; op: "add" | "update" | "remove"; patch: TRow }`.
 * `patch` is ALWAYS the COMPLETE row — for every op, including `remove` —
 * never a partial diff and never absent. That is what lets `toRequests`
 * be self-sufficient: `composeBatch` stays pure with no query-cache
 * access, and a draft restored after a failed baseline fetch still
 * carries everything a submit needs (a patchless `remove` would leave
 * nothing to build an entered-in-error soft-delete body from).
 */
export type RowEdit<TRow extends object> = StructuredEdit<TRow>;

export type EditLog<TRow extends object> = readonly RowEdit<TRow>[];

/** One row as the editor renders it: baseline merged with its edit. */
export interface ProjectedRow<TRow extends object> {
  rowId: RowId;
  row: TRow;
  /**
   * `"baseline"` — came from the server this session (possibly patched).
   * `"added"` — created here. Deliberately not derived from `!!row.id`: a
   * historical row re-added through `HistoricalRecordSelector` has its id
   * stripped and is genuinely new.
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
 * field, so un-removing is an ordinary update.
 */
export interface SoftDeleteDescriptor<TRow extends object> {
  /**
   * Written onto the row when `removeRow` hits a baseline row — just the
   * marker fields (e.g. `{ verification_status: "entered_in_error" }`), on
   * top of the row's existing values. Deliberately `Partial<TRow>`, unlike
   * `RowEdit.patch` (above), which must be the row's COMPLETE content:
   * this `patch` is merged onto an already-known baseline row by the
   * reducer before it ever becomes a `RowEdit`, so it only needs to carry
   * what changes, not the whole row.
   */
  patch: Partial<TRow>;
  /** Does the row already carry the marker? */
  isDeleted: (row: TRow) => boolean;
}

export type ProjectValues<TRow extends object> = (
  rows: readonly TRow[],
) => ResponseValue[];
