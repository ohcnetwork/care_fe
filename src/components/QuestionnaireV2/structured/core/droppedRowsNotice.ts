import type { EditLog, RowId } from "./types";

/**
 * One dropped row, ready for display. Spec amendment A1's restore notice
 * (`fill/draft/*`, `.superpowers/sdd/closeout1-report.md`) already names a
 * PLAIN answer the compatibility merge could not carry over, computed at
 * load time before the clinician even chooses Resume. A structured row's
 * drop cannot be known that early — it depends on the REFETCHED server
 * baseline, which only resolves once this question's own editor mounts
 * (`useStructuredRows`' `droppedEdits`, populated by its passive
 * orphan-prune effect) — so this is a SEPARATE, later notice, scoped to one
 * question, not a channel into the pre-Resume `DraftRestoreBar`.
 */
export interface DroppedRowLabel {
  rowId: RowId;
  label: string;
}

/**
 * Turns `useStructuredRows`' `droppedEdits` (every edit pruned this mount
 * because its baseline row vanished server-side) into clinician-facing
 * labels — one per dropped row, in the order the prune effect encountered
 * them.
 *
 * `rowLabel` is deliberately the CALLER's job, not this function's: every
 * editor already has this exact logic (`StructuredList`'s own `rowTitle`
 * prop — the row's display name, e.g. a medication's name, an allergy's
 * substance, a diagnosis's code display) and this reuses it rather than
 * inventing a second "what does this row mean" derivation that could drift
 * from the first. `patch` is always the row's COMPLETE content, for every
 * op including `remove` (`RowEdit`'s own doc comment,
 * `core/types.ts`), so `rowLabel` never sees a partial/undefined row here.
 *
 * A `rowLabel` that returns an empty/blank string (a row whose display
 * field was itself blank) falls back to the raw `rowId` — an ugly label is
 * still strictly better than a silently blank list entry the clinician
 * cannot connect to anything.
 */
export function droppedRowLabels<TRow extends object>(
  droppedEdits: EditLog<TRow>,
  rowLabel: (row: TRow) => string,
): DroppedRowLabel[] {
  return droppedEdits.map((edit) => ({
    rowId: edit.rowId,
    label: rowLabel(edit.patch).trim() || edit.rowId,
  }));
}
