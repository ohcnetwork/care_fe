import type { ResponseValue } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

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
 * User intent, typed. `add` carries the WHOLE row (there is no baseline to
 * merge it onto); `update` carries only the fields the user changed;
 * `remove` carries nothing.
 *
 * Rows are objects by construction — `time_of_death`'s wire projection is
 * `string[]`, so its ROW type is `{ deceased_datetime: string }` and its
 * `projectValues` unwraps it. That keeps `Partial<TRow>` meaningful for
 * every type and keeps the zod row schemas (A2) uniform.
 */
export type RowEdit<TRow extends object> =
  | { op: "add"; row_id: RowId; patch: TRow }
  | { op: "update"; row_id: RowId; patch: Partial<TRow> }
  | { op: "remove"; row_id: RowId };

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
 * The same, unnarrowed — what host-side (plugin-capable) code holds.
 *
 * Deviation from the design annex (`docs/superpowers/specs/annexes/
 * p1-state-core.md` §2.1/§2.2): that draft assumed a sibling
 * `StructuredEditLog` type living in a new `src/types/questionnaire/
 * edits.ts` module. Task 1 (see `.superpowers/sdd/task-1-report.md`)
 * instead shipped the equivalent type-erased edit vocabulary as
 * `StructuredEditRecord` directly on `src/types/questionnaire/
 * structured.ts` — no `edits.ts` module was created. `StructuredEditRecord`
 * (`{ rowId, op, patch: unknown }`) is that vocabulary's actual landed
 * form, so it is reused here rather than inventing the type the annex
 * assumed but that was never built.
 */
export interface StructuredEditInput {
  edits: readonly StructuredEditRecord[];
  projection: readonly unknown[];
}

export type ProjectValues<TRow extends object> = (
  rows: readonly TRow[],
) => ResponseValue[];
