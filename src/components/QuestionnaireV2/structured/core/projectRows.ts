import type {
  BaselineRow,
  EditLog,
  ProjectedRow,
  RowEdit,
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * Options for {@link projectRows}. Signature per `task-4-brief.md` /
 * `2026-08-04-phase1-core-kit.md:162` (the plan's own binding "Produces"
 * line) — not `annexes/p1-state-core.md` §5's draft. Two deliberate
 * narrowings from the annex, both intentional here, not oversights:
 *
 *  - No `single` flag. The annex's `single?: boolean` truncates the
 *    result to at most one row for a singleton type. Nothing in Tasks
 *    1–3 needs it, no test in this task's required list exercises it, and
 *    the plan's exact signature (line 162) omits it. A singleton type's
 *    "at most one row" invariant is a `rowId` stability property
 *    (`SINGLETON_ROW_ID`, `core/rowIds.ts`) enforced by never having more
 *    than one entry share that id — not something this function needs to
 *    truncate for.
 *  - No `orphanRowIds` in the return. The annex wraps the result in a
 *    `Projection<TRow>` (`{ rows, orphanRowIds }`) so a caller can surface
 *    a "this row no longer exists" notice (deferred to a later phase per
 *    the annex's own note). The plan's signature returns
 *    `ProjectedRow<TRow>[]` directly — no wrapper, no orphan channel. See
 *    the doc comment on the drop-silently behavior below for what that
 *    means functionally; `task-4-report.md` records this as a translation
 *    decision, not a gap.
 */
export interface ProjectRowsOptions<TRow extends object> {
  /**
   * How a type marks — instead of deletes — a baseline row's removal.
   * See `SoftDeleteDescriptor`'s doc comment in `./types` for the full
   * contract, including why ITS `patch` is `Partial<TRow>` while
   * `RowEdit.patch` (below) never is — two different things named
   * `patch` on purpose, per that comment.
   *
   * Read here only via `isDeleted`, to decide `ProjectedRow.softDeleted`
   * for whatever row content is already on screen — a row can be flagged
   * `softDeleted` because ITS BASELINE data already carries the marker
   * (a row soft-deleted in an earlier session, now fetched as ordinary
   * baseline content) just as much as because THIS session's edit added
   * it. `projectRows` never writes the marker itself: that is
   * `removeRow`'s job (a later task), which merges `softDelete.patch`
   * into an `update` edit's patch before it ever reaches this function.
   */
  softDelete?: SoftDeleteDescriptor<TRow>;
  /**
   * DISPLAY ONLY. Applied as a stable sort over the canonical order
   * (baseline order, then added rows in edit-log order) computed below.
   * Nothing downstream reads row order — requests are built from the
   * edit log (Task 5's differ), identity comes from `rowId` — so sorting
   * the array this function returns can never reach the edit log, a
   * request body, or a rowId.
   *
   * This is what lets `diagnosis` sort its display by onset date
   * (`DiagnosisQuestion.tsx:366-378`) without the SORTED-ARRAY WRITE-BACK
   * that is the actual bug this option exists to retire: today
   * `DiagnosisQuestion` sorts its rows by onset and writes the sorted
   * array back as the persisted order, so a later per-index server
   * lookup (`:697`) indexes a sorted array against the server's
   * unsorted response and reads the wrong row. `displayOrder` reorders
   * only the array `projectRows` returns; the baseline argument and the
   * edit log it was computed from are asserted unchanged by
   * `projectRows.test.ts`'s "Diagnosis bug" case.
   */
  displayOrder?: (a: TRow, b: TRow) => number;
}

/**
 * Computes what the clinician SEES for one structured section: baseline
 * (the complete fetched server-row set, per the BASELINE COMPLETENESS
 * CONTRACT — `2026-08-04-phase1-core-kit.md`'s Global Constraints) plus
 * the pending edit log (Task 3's `applyEditToLog`, which guarantees at
 * most one entry per `rowId`). This is what `values[0].value` carries for
 * every v2 structured question — the answered predicate
 * (`form/engine/store.ts:372-376`'s `entryHasContent`), outline ticks,
 * readonly renderers and server-draft dumps all read the array this
 * returns, via `ProjectValues<TRow>` mapping over it.
 *
 * Pure and total: never mutates `baseline` or `log` (or anything reachable
 * from either) and always returns a fresh array. Design source:
 * `annexes/p1-state-core.md` §5, translated per the plan's CANONICAL EDIT
 * VOCABULARY section — see the per-step comments below for exactly where
 * the annex's draft code is NOT copied verbatim and why.
 *
 * Building blocks, in the order they run:
 *
 * 1. **Baseline rows**, in the order the query layer returned them. A
 *    baseline row's position in the output NEVER depends on whether (or
 *    how) it was edited — see the `displayOrder` doc comment above for
 *    why that invariant matters.
 *    - An edit with `op: "remove"` hides the row outright ("hard
 *      removal") — unconditionally, even if a `softDelete` descriptor is
 *      configured. `remove` always means gone, never greyed out: a type
 *      that marks instead of deletes never actually produces a `remove`
 *      op against a baseline row in the first place (its `removeRow`
 *      merges the descriptor's marker fields into an `update` instead —
 *      see `SoftDeleteDescriptor`'s doc comment) so this branch is a
 *      genuine "delete", used by a type with no soft-delete descriptor
 *      at all, or reached defensively for any log that does carry a
 *      literal `remove` against a baseline row.
 *    - Any other matching edit (`op: "add"` or `"update"` — see the
 *      collision note below for why `"add"` can legitimately reach here)
 *      contributes `edit.patch` as the row's content, a full REPLACE, not
 *      a merge with `entry.row`. Annex §5's draft code does
 *      `{ ...entry.row, ...(edit.patch as Partial<TRow>) }`, correct
 *      under ITS OLD, non-canonical vocabulary where `update`'s patch was
 *      a partial diff. Under the shipped vocabulary (`structured.ts`'s
 *      `StructuredEditOp` doc, restated in the plan's CANONICAL EDIT
 *      VOCABULARY table) `patch` is ALWAYS the complete row — "the row as
 *      it now reads (baseline row with the clinician's fields already
 *      applied)". Merging it over `entry.row` again would not just be
 *      redundant, it would silently paper over a patch that (by caller
 *      bug) omitted a baseline-only field, masking exactly the kind of
 *      mistake this layer should surface. `editLog.ts`'s own coalescing
 *      makes the identical call ("every 'merge' cell in the annex's
 *      table becomes a plain replace here") — this keeps the two pure
 *      modules agreeing on what `patch` means.
 *
 * 2. **Added rows**, in edit-log order — insertion order, stable across a
 *    baseline refetch (a refetch never touches the log). An `op: "add"`
 *    edit whose `rowId` the baseline loop above already emitted is
 *    SKIPPED here rather than pushed a second time. JUDGMENT CALL,
 *    documented and tested (`projectRows.test.ts`'s "singleton-draft-
 *    outrun-by-baseline" case): the annex's draft code has no such guard,
 *    but under the plan's simplified signature there is nothing else to
 *    prevent one `rowId` from rendering as two `ProjectedRow`s if a stale
 *    `add` edit's identity happens to coincide with a rowId the baseline
 *    has since learned about. The realistic path is a single-row type's
 *    fixed `SINGLETON_ROW_ID` (`core/rowIds.ts`): a draft restored from
 *    local storage can carry `{rowId: SINGLETON_ROW_ID, op: "add", ...}`
 *    from before the server row existed, while the freshly fetched
 *    baseline now has an entry for that same id. Treating the collision
 *    as "the baseline row wins, with the add edit's patch as its content"
 *    (rather than "two rows, or crash, or silently drop one arbitrarily")
 *    is what the baseline loop's "any non-remove edit is a full replace"
 *    rule (step 1 above) already does for exactly this rowId — this skip
 *    is what keeps step 2 from then ALSO rendering it.
 *
 * 3. **Everything else is dropped, silently.** An edit whose `rowId` is
 *    in neither the baseline nor emitted as an add above — an `update` or
 *    `remove` targeting a rowId the (complete) baseline does not contain
 *    — is the annex's §5 "orphan": intent about a row that no longer
 *    exists, typically a restored draft whose server row vanished between
 *    sessions. The annex reports these via a separate `orphanRowIds`
 *    channel on its `Projection<TRow>` wrapper; this task's binding
 *    signature returns `ProjectedRow<TRow>[]` directly, with no such
 *    channel (see `ProjectRowsOptions`'s doc comment). So here an orphan
 *    is simply never added to `rows` — nothing renders it, nothing
 *    crashes on it, and it does not resurrect merely by calling this
 *    function again with the same log: resurrection would require an
 *    edit that actually matches a real baseline row or a real `add`.
 *    (Surfacing a visible "this entry could not be restored" notice from
 *    the dropped rowIds, per the annex's Phase-5 intent, is left to
 *    whichever later task re-adds that channel — not silently designed
 *    around here.)
 *
 * 4. **`displayOrder`**, applied last, via `Array.prototype.sort` (stable
 *    since ES2019/Node's baseline), so rows the comparator treats as
 *    equal keep the canonical order built above. Sorts the freshly built
 *    `rows` array — never `baseline` or `log`, which are read-only
 *    throughout.
 */
export function projectRows<TRow extends object>(
  baseline: readonly BaselineRow<TRow>[],
  log: EditLog<TRow>,
  options: ProjectRowsOptions<TRow> = {},
): ProjectedRow<TRow>[] {
  const { softDelete, displayOrder } = options;

  const editByRowId = new Map<RowId, RowEdit<TRow>>();
  for (const edit of log) editByRowId.set(edit.rowId, edit);

  const baselineRowIds = new Set<RowId>(baseline.map((entry) => entry.rowId));

  const rows: ProjectedRow<TRow>[] = [];

  // 1. Baseline, in the order the query layer returned it.
  for (const entry of baseline) {
    const edit = editByRowId.get(entry.rowId);
    if (edit?.op === "remove") continue; // hard removal — see doc comment

    const row = edit ? edit.patch : entry.row; // full replace, never a merge

    rows.push({
      rowId: entry.rowId,
      row,
      origin: "baseline",
      edited: edit !== undefined,
      softDeleted: softDelete?.isDeleted(row) ?? false,
    });
  }

  // 2. Adds, in edit-log order. Two guards, in order:
  //    - `editByRowId.get(edit.rowId) !== edit` skips any entry that a
  //      LATER entry for the same rowId superseded in the raw `log`
  //      array. Task 3's `applyEditToLog` guarantees at most one entry
  //      per rowId, so this never fires against a log it produced — but
  //      a restored draft's per-record `isStructuredEditRecord` gate
  //      validates each entry independently and would happily accept two
  //      malformed entries sharing a rowId. Without this guard,
  //      `[add("dup", first), add("dup", second)]` would emit TWO
  //      `ProjectedRow`s both keyed "dup" (this loop has no de-dup of its
  //      own otherwise), and `[add("z", stale), update("z", fresh)]`
  //      would show `stale` here while loop 1 (which already reads
  //      through `editByRowId`, i.e. last-write-wins) would show `fresh`
  //      for the same rowId if baseline happens to contain it — two
  //      loops disagreeing about one rowId's content. Resolving both
  //      loops through the same last-write map keeps them in agreement
  //      by construction, matching the sibling duplicate guard below.
  //    - `baselineRowIds.has(edit.rowId)` skips a rowId the baseline loop
  //      already emitted — see the collision note in the function doc
  //      comment.
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

  // 3. Every other edit (an orphan) is simply never added above — no
  //    further action needed here. See the function doc comment.

  // 4. Display sort — output only.
  if (displayOrder) {
    rows.sort((a, b) => displayOrder(a.row, b.row));
  }

  return rows;
}
