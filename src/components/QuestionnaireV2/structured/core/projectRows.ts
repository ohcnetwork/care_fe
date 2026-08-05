import { dedupeEditsFirstAppearance } from "./editLog";
import type {
  BaselineRow,
  EditLog,
  ProjectedRow,
  RowEdit,
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * Options for {@link projectRows}. Two deliberate narrowings:
 *
 *  - No `single` flag: a singleton's at-most-one-row invariant is a rowId
 *    stability property (`SINGLETON_ROW_ID`), not a truncation this
 *    function performs — see {@link truncateToSingletonRow}.
 *  - No orphan channel bundled into the return: {@link findOrphanRowIds}
 *    is the sibling function over the same `(baseline, log)` inputs.
 *
 * `baseline` is the COMPLETE fetched server-row set, or `undefined` while
 * unknown — never a partial array standing in for "loading".
 */
export interface ProjectRowsOptions<TRow extends object> {
  /**
   * How a type marks — instead of deletes — a baseline row's removal.
   * See `SoftDeleteDescriptor` in `./types` for the full contract.
   *
   * Read here only via `isDeleted`, to decide `ProjectedRow.softDeleted`
   * for whatever row content is already on screen — a row can be flagged
   * because its baseline data already carries the marker (soft-deleted in
   * an earlier session) just as much as because this session's edit added
   * it. `projectRows` never writes the marker itself; that is
   * `removeRow`'s job.
   */
  softDelete?: SoftDeleteDescriptor<TRow>;
  /**
   * DISPLAY ONLY. Applied as a stable sort over the canonical order
   * (baseline order, then added rows in edit-log order). Nothing
   * downstream reads row order — requests are built from the edit log,
   * identity from `rowId` — so this sort can never reach the edit log, a
   * request body, or a rowId.
   */
  displayOrder?: (a: TRow, b: TRow) => number;
}

/**
 * Computes what the clinician SEES for one structured section: baseline
 * (complete fetched server-row set, or `undefined` while unknown) plus
 * the pending edit log. This is what `values[0].value` carries for every
 * v2 structured question — the answered predicate, outline ticks,
 * readonly renderers and server-draft dumps all read the array this
 * returns. Pure: never mutates `baseline` or `log`.
 *
 * Steps, in order:
 *
 * 1. Baseline rows, in the order the query layer returned them — a row's
 *    position never depends on whether it was edited. An `op: "remove"`
 *    edit hides the row outright (a marking type's `removeRow` records an
 *    `update`, never a `remove`, so this branch is a genuine delete). Any
 *    other matching edit contributes `edit.patch` as the row's content —
 *    a full REPLACE, never a merge: `patch` is always the complete row.
 *
 * 2. Added rows, in edit-log order — stable across a baseline refetch. An
 *    `add` whose rowId step 1 already emitted is SKIPPED: a restored
 *    draft can carry an `add` recorded before the server row existed
 *    while the fresh baseline now has that id — the baseline row wins,
 *    with the add's patch as its content, rather than one rowId rendering
 *    as two rows.
 *
 * 3. When `baseline` is a known array, every remaining `update`/`remove`
 *    is an orphan — intent about a row the complete baseline lacks — and
 *    is never rendered; {@link findOrphanRowIds} names these. When
 *    `baseline` is `undefined` (loading/errored), an unmatched `update`
 *    is unresolved, not orphaned — see step 3 in the implementation.
 *
 * 4. `displayOrder`, applied last via a stable sort.
 */
export function projectRows<TRow extends object>(
  baseline: readonly BaselineRow<TRow>[] | undefined,
  log: EditLog<TRow>,
  options: ProjectRowsOptions<TRow> = {},
): ProjectedRow<TRow>[] {
  const { softDelete, displayOrder } = options;

  const editByRowId = new Map<RowId, RowEdit<TRow>>();
  for (const edit of log) editByRowId.set(edit.rowId, edit);

  // `undefined` means "not yet known"; only the ORIGINAL `baseline`
  // parameter is what step 3 branches on.
  const baselineRows = baseline ?? [];
  const baselineRowIds = new Set<RowId>(
    baselineRows.map((entry) => entry.rowId),
  );

  const rows: ProjectedRow<TRow>[] = [];

  // 1. Baseline, in the order the query layer returned it.
  for (const entry of baselineRows) {
    const edit = editByRowId.get(entry.rowId);
    if (edit?.op === "remove") continue;

    const row = edit ? edit.patch : entry.row;

    rows.push({
      rowId: entry.rowId,
      row,
      origin: "baseline",
      edited: edit !== undefined,
      softDeleted: softDelete?.isDeleted(row) ?? false,
    });
  }

  // 2. Adds, in edit-log order. Two guards:
  //    - `editByRowId.get(edit.rowId) !== edit` skips an entry a later
  //      entry for the same rowId superseded (`applyEditToLog` never
  //      produces duplicates, but a restored draft's per-record
  //      validation admits them).
  //    - `baselineRowIds.has(edit.rowId)` skips a rowId loop 1 already
  //      emitted — see the collision note in the doc comment.
  for (const edit of log) {
    if (editByRowId.get(edit.rowId) !== edit) continue;
    if (edit.op !== "add") continue;
    if (baselineRowIds.has(edit.rowId)) continue;

    rows.push({
      rowId: edit.rowId,
      row: edit.patch,
      origin: "added",
      edited: true,
      softDeleted: softDelete?.isDeleted(edit.patch) ?? false,
    });
  }

  // 3. `baseline === undefined` means the query is loading or errored,
  //    NOT "the server confirmed zero rows" — an unmatched `update` is
  //    unresolved, not a confirmed orphan. Render it from its own patch
  //    (already the complete row) so a restored draft stays visible — and
  //    still submittable — during the loading window. `origin` is
  //    "baseline" so the row doesn't visually flip when the real baseline
  //    arrives and confirms it.
  if (baseline === undefined) {
    for (const edit of log) {
      if (editByRowId.get(edit.rowId) !== edit) continue;
      if (edit.op !== "update") continue;

      rows.push({
        rowId: edit.rowId,
        row: edit.patch,
        origin: "baseline",
        edited: true,
        softDeleted: softDelete?.isDeleted(edit.patch) ?? false,
      });
    }
  }

  // 4. Display sort — output only.
  if (displayOrder) {
    rows.sort((a, b) => displayOrder(a.row, b.row));
  }

  return rows;
}

/**
 * Names the rowIds {@link projectRows} silently drops: a restored edit
 * whose baseline row vanished server-side must be LISTED to the
 * clinician, not just disappear. Computed over the identical
 * `(baseline, log)` inputs `projectRows` takes, so the two can never
 * disagree about which edits are showing versus orphaned.
 *
 * `undefined` baseline returns `[]`: unresolved is not confirmed-gone.
 *
 * The predicate is `op !== "add" && !baselineRowIds.has(rowId)` —
 * deliberately NOT "not rendered", which would also flag the clinician's
 * own remove of an added row and every ordinary `add`.
 *
 * Pure; duplicates in a malformed log are reported once
 * ({@link dedupeEditsFirstAppearance}).
 */
export function findOrphanRowIds<TRow extends object>(
  baseline: readonly BaselineRow<TRow>[] | undefined,
  log: EditLog<TRow>,
): readonly RowId[] {
  if (baseline === undefined) return [];
  const baselineRowIds = new Set<RowId>(baseline.map((entry) => entry.rowId));

  const orphanRowIds: RowId[] = [];
  for (const edit of dedupeEditsFirstAppearance(log)) {
    if (edit.op !== "add" && !baselineRowIds.has(edit.rowId)) {
      orphanRowIds.push(edit.rowId);
    }
  }
  return orphanRowIds;
}

/**
 * Drops every {@link findOrphanRowIds} entry from `log`: what remains is
 * exactly what `projectRows` still renders (plus what it presumes during
 * the loading window) — never intent about a row the complete, known
 * baseline has confirmed gone.
 *
 * This lives at the hook, not the compose/submit seam: `toRequests` and
 * `resolveChanges` never hold a baseline at submit time, so
 * `useStructuredRows` — the one place `baseline` and `edits` coexist —
 * must prune before its `commit` write.
 *
 * Deliberately NOT the clinician's `removeRow` path: no soft-delete
 * marker is written and no request is implied — the entry is simply
 * excised. A no-op while `baseline` is `undefined`.
 *
 * Pure; returns the SAME `log` reference when nothing is dropped, so a
 * caller can skip a write on reference equality.
 */
export function pruneOrphanEdits<TRow extends object>(
  baseline: readonly BaselineRow<TRow>[] | undefined,
  log: EditLog<TRow>,
): EditLog<TRow> {
  const orphanRowIds = findOrphanRowIds(baseline, log);
  if (orphanRowIds.length === 0) return log;
  const orphanSet = new Set(orphanRowIds);
  return log.filter((edit) => !orphanSet.has(edit.rowId));
}

/**
 * Restricts an edit log to at most the ONE rowId {@link projectRows}
 * would show as `rows[0]` for the same `(baseline, log)` pair.
 *
 * Why: singleton mode only ever SHOWS `rows[0]`, but nothing upstream
 * stops the log from holding a second rowId — an `initialEdits` seed
 * writes an `add` under `singletonRowId`, an `add` is never an orphan,
 * and if a real baseline row for the same question resolves under its
 * OWN server id while that seed is still in the log, the two coexist: a
 * caller writing `edits` from every projected row would silently submit
 * BOTH on Save. Keeps whichever rowId `projectRows` shows FIRST, so "the
 * one row" is defined by the exact projection the clinician sees.
 *
 * Unreachable for every type shipped so far — closed by construction
 * rather than left as a trap for the next singleton.
 *
 * Pure; returns the SAME `log` reference when there is nothing to drop.
 */
export function truncateToSingletonRow<TRow extends object>(
  baseline: readonly BaselineRow<TRow>[] | undefined,
  log: EditLog<TRow>,
  options: ProjectRowsOptions<TRow> = {},
): EditLog<TRow> {
  if (log.length === 0) return log;
  // Checks the FULL PROJECTION's row count, not `log.length` — a baseline
  // can contribute rows the log never mentions (a real baseline row under
  // its own id, plus a single seeded `add` under a different id, is a
  // one-entry log that still projects TWO rows).
  const rows = projectRows(baseline, log, options);
  if (rows.length <= 1) return log;
  const keepRowId = rows[0]?.rowId;
  // No row projects at all — nothing to keep; leave `log` for orphan
  // pruning to handle. Defensive: unreachable alongside `rows.length > 1`.
  if (keepRowId === undefined) return log;
  const truncated = log.filter((edit) => edit.rowId === keepRowId);
  return truncated.length === log.length ? log : truncated;
}
