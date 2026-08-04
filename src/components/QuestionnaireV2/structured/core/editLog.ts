import { deepEqualJson } from "./deepEqual";
import type { EditLog, RowEdit, RowId } from "./types";

/**
 * Options for {@link applyEditToLog}. Signature per task-3-brief.md /
 * annex `p1-state-core.md` §6, translated: the annex's draft
 * `ApplyEditOptions` also carried an `isEmptyRow` hook for annihilating an
 * added-then-emptied row (`AppointmentQuestion.tsx:144-153`-style). That
 * hook belongs to `removeRow` (annex §7, a later task's concern, not
 * listed among this task's coalescing rules) — it is deliberately not
 * part of this reducer's surface. See task-3-report.md for the full note.
 */
export interface ApplyEditOptions<TRow extends object> {
  /**
   * rowId → the unedited server row. Used to canonicalize an `update`
   * patch back to "no edit at all" once it matches what the server
   * already has — that is what makes "dirty" derived rather than sticky
   * (mild → moderate → mild leaves the section pristine).
   *
   * A rowId absent from this map (or the map itself absent) can never be
   * detected as "reverted" — by design. A row with no baseline entry is
   * an add, and an add was never on the server to revert to.
   */
  baseline?: ReadonlyMap<RowId, TRow>;
}

/**
 * Folds one more edit into the log, preserving the invariant the whole
 * state-core design depends on: **at most one entry per rowId, always**.
 * This is what makes "a clinician who never touched a section sends zero
 * requests for it" true by construction, rather than by convention.
 *
 * Pure and total — never mutates `log` (always returns a new array) and
 * never mutates an existing entry in place. This is also the exact
 * function the assistant's `applyStructuredEdit` path will call in a
 * later phase, so human input and assistant input cannot diverge.
 *
 * Coalescing table (existing entry's op × incoming edit's op) — see
 * `annexes/p1-state-core.md` §6 for the original derivation. Two cells
 * are translated from the annex's draft rather than copied verbatim,
 * because they were written against the OLD edit vocabulary (`Partial`
 * update patches, patchless removes); both translations are noted where
 * they apply below and in task-3-report.md:
 *
 * | existing  | incoming `add`         | incoming `update`         | incoming `remove` |
 * |-----------|-------------------------|----------------------------|--------------------|
 * | *(none)*  | append `add`            | append `update`; drop if patch canonicalizes to baseline | append `remove` |
 * | `add`     | replace patch, stays `add` | replace patch, stays `add` | **annihilate** (row never reached the server) |
 * | `update`  | replace patch, becomes `add` (dormant/assistant-only) | replace patch, canonicalize against baseline, **drop if reverted** | replace with `remove` |
 * | `remove`  | **resurrect as `update`** (translated — see below) | resurrect as `update` (restore-and-patch) | keep `remove` (idempotent) |
 */
export function applyEditToLog<TRow extends object>(
  log: EditLog<TRow>,
  edit: RowEdit<TRow>,
  options: ApplyEditOptions<TRow> = {},
): EditLog<TRow> {
  const { baseline } = options;
  const index = log.findIndex((entry) => entry.rowId === edit.rowId);

  if (index === -1) {
    return appendFresh(log, edit, baseline);
  }

  const existing = log[index];
  const resolved = coalesce(existing, edit, baseline);

  if (resolved === null) {
    // Annihilated (add→remove) — drop the slot, preserving the relative
    // order of every other entry.
    return [...log.slice(0, index), ...log.slice(index + 1)];
  }

  const next = log.slice();
  next[index] = resolved;
  return next;
}

function appendFresh<TRow extends object>(
  log: EditLog<TRow>,
  edit: RowEdit<TRow>,
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): EditLog<TRow> {
  if (edit.op === "update" && isRevertedToBaseline(edit, baseline)) {
    // A no-op update against a known baseline is never recorded in the
    // first place — the section stays honestly pristine.
    return log.slice();
  }
  // Appends go to the end — add order is display order for added rows,
  // and this is the only path that grows the log's length.
  return [...log, edit];
}

function coalesce<TRow extends object>(
  existing: RowEdit<TRow>,
  incoming: RowEdit<TRow>,
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): RowEdit<TRow> | null {
  switch (existing.op) {
    case "add":
      return coalesceOntoAdd(existing, incoming);
    case "update":
      return coalesceOntoUpdate(existing, incoming, baseline);
    case "remove":
      return coalesceOntoRemove(existing, incoming);
  }
}

function coalesceOntoAdd<TRow extends object>(
  existing: RowEdit<TRow>,
  incoming: RowEdit<TRow>,
): RowEdit<TRow> | null {
  if (incoming.op === "remove") {
    // The row never reached the server — there is nothing to tell it
    // about. Annihilate; the log returns to pristine for this rowId.
    return null;
  }
  // incoming is "add" (an assistant re-add) or "update" — either way the
  // row still hasn't been created server-side, so it stays an `add`.
  // `patch` is always the complete row under the canonical vocabulary, so
  // this is a full replace, never a field-level merge.
  return { rowId: existing.rowId, op: "add", patch: incoming.patch };
}

function coalesceOntoUpdate<TRow extends object>(
  existing: RowEdit<TRow>,
  incoming: RowEdit<TRow>,
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): RowEdit<TRow> | null {
  if (incoming.op === "remove") {
    return { rowId: existing.rowId, op: "remove", patch: incoming.patch };
  }
  if (incoming.op === "add") {
    // Dormant / assistant-only path (annex §6): a same-rowId `add` while
    // an `update` is already pending. No human-driven editor produces
    // this (a real add always mints a fresh rowId), but the annex names
    // it, so it is handled rather than left to throw: replace the patch
    // and keep the entry as `add`, matching the annex's stated cell.
    return { rowId: existing.rowId, op: "add", patch: incoming.patch };
  }
  // incoming is "update": replace the patch (always the complete row —
  // no field-level merge needed), then canonicalize against baseline.
  // This is the "edit-then-revert" case: mild → moderate → mild must
  // leave the section clean.
  if (
    isRevertedToBaseline(
      { rowId: existing.rowId, patch: incoming.patch },
      baseline,
    )
  ) {
    return null;
  }
  return { rowId: existing.rowId, op: "update", patch: incoming.patch };
}

function coalesceOntoRemove<TRow extends object>(
  existing: RowEdit<TRow>,
  incoming: RowEdit<TRow>,
): RowEdit<TRow> | null {
  if (incoming.op === "remove") {
    // Idempotent — keep the existing remove untouched.
    return existing;
  }
  // incoming is "add" or "update": a legal resurrection of a row that
  // carried a pending `remove`. A rowId can only reach this state via a
  // baseline row (an added row's remove is annihilated, never leaving a
  // `remove` entry — see coalesceOntoAdd), so restoring it is genuinely
  // an update to an existing server row, never a fresh creation.
  //
  // TRANSLATION FROM THE ANNEX: `p1-state-core.md` §6's table drafts this
  // cell as "replace with `add`" for an incoming `add`. That was written
  // against a vocabulary where `add` meant something looser; under the
  // shipped canonical vocabulary (stable, client-owned `rowId` — server id
  // for a row that exists on the server, uuid only for a row that never
  // did) an `add` op on a rowId that just had a `remove` entry cannot
  // mean "brand new server row" — the rowId is already known. task-3's
  // brief makes this explicit ("remove → add ... is a legal resurrection:
  // ONE update"), so both incoming `add` and incoming `update` resolve
  // to the same single `update` entry here. Noted in task-3-report.md.
  return { rowId: existing.rowId, op: "update", patch: incoming.patch };
}

/**
 * Has this edit's patch collapsed back to exactly what the baseline
 * already holds for this rowId? Structural (JSON) equality, per
 * `deepEqualJson`'s doc comment — not `===`, since a patch is routinely
 * rebuilt as a fresh object (`{ ...baselineRow, field: value }`).
 *
 * Deliberately `false` when there is no baseline entry for this rowId
 * (map absent, or rowId not present in it): nothing to compare against
 * means nothing can be called a revert.
 */
function isRevertedToBaseline<TRow extends object>(
  edit: { rowId: RowId; patch: TRow },
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): boolean {
  const baselineRow = baseline?.get(edit.rowId);
  if (baselineRow === undefined) return false;
  return deepEqualJson(edit.patch, baselineRow);
}
