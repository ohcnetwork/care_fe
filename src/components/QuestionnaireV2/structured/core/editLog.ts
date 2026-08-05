import { deepEqualJson } from "./deepEqual";
import type { BaselineRow, EditLog, RowEdit, RowId } from "./types";

/**
 * Builds the reducer's `baseline` map (and `projectRows`' equivalent
 * input) from the hook's `BaselineRow<TRow>[]`. `undefined` in,
 * `undefined` out — never coerced to an empty `Map`, which would be
 * misread as "this rowId is provably not on the server"
 * (`resolveOpAgainstBaseline`) instead of "not yet known".
 *
 * Pure: never mutates `baseline`.
 */
export function toBaselineMap<TRow extends object>(
  baseline: readonly BaselineRow<TRow>[] | undefined,
): ReadonlyMap<RowId, TRow> | undefined {
  if (baseline === undefined) return undefined;
  return new Map(baseline.map((entry) => [entry.rowId, entry.row] as const));
}

/** Options for {@link applyEditToLog}. */
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
  /**
   * An ADDED row that satisfies this after an `update` replaces its patch
   * is annihilated — the row never reached the server, so clearing it
   * back to nothing is indistinguishable from never adding it. Applies
   * only to the existing-`add` × incoming-`update` cell, never to a
   * re-`add`, which is a fresh, deliberate creation.
   */
  isEmptyRow?: (row: TRow) => boolean;
}

/**
 * Folds one more edit into the log, preserving the invariant the whole
 * state core depends on: **at most one entry per rowId, always**. This is
 * what makes "a clinician who never touched a section sends zero requests
 * for it" true by construction rather than by convention.
 *
 * Pure and total — never mutates `log` or an existing entry. The
 * assistant's edit path calls this same function, so human and assistant
 * input cannot diverge.
 *
 * Coalescing table (existing entry's op × incoming edit's op):
 *
 * | existing  | incoming `add`         | incoming `update`         | incoming `remove` |
 * |-----------|-------------------------|----------------------------|--------------------|
 * | *(none)*  | append `add`            | append `update`; drop if patch canonicalizes to baseline | append `remove` |
 * | `add`     | replace patch, stays `add` | replace patch, stays `add`; **annihilate instead if `isEmptyRow(patch)`** | **annihilate** (row never reached the server) |
 * | `update`  | **resolved against `baseline`** — `add` if the rowId provably isn't in it, else replace patch and stay `update` | replace patch, canonicalize against baseline, **drop if reverted** | replace with `remove` |
 * | `remove`  | **resolved against `baseline`** — `add` if the rowId provably isn't in it, else `update` (restore-and-patch) | same resolution as the `add` column | keep `remove` (idempotent) |
 *
 * The "resolved against `baseline`" cells never trust an op label as a
 * proxy for "this rowId is really on the server" — both labels are
 * forgeable by annihilation (see `resolveOpAgainstBaseline`); the
 * baseline map is the only source of truth consulted there.
 */
export function applyEditToLog<TRow extends object>(
  log: EditLog<TRow>,
  edit: RowEdit<TRow>,
  options: ApplyEditOptions<TRow> = {},
): EditLog<TRow> {
  const { baseline, isEmptyRow } = options;
  const index = log.findIndex((entry) => entry.rowId === edit.rowId);

  if (index === -1) {
    return appendFresh(log, edit, baseline);
  }

  const existing = log[index];
  const resolved = coalesce(existing, edit, baseline, isEmptyRow);

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
  isEmptyRow: ((row: TRow) => boolean) | undefined,
): RowEdit<TRow> | null {
  switch (existing.op) {
    case "add":
      return coalesceOntoAdd(existing, incoming, isEmptyRow);
    case "update":
      return coalesceOntoUpdate(existing, incoming, baseline);
    case "remove":
      return coalesceOntoRemove(existing, incoming, baseline);
  }
}

function coalesceOntoAdd<TRow extends object>(
  existing: RowEdit<TRow>,
  incoming: RowEdit<TRow>,
  isEmptyRow: ((row: TRow) => boolean) | undefined,
): RowEdit<TRow> | null {
  if (incoming.op === "remove") {
    // The row never reached the server — there is nothing to tell it
    // about. Annihilate; the log returns to pristine for this rowId.
    return null;
  }
  // incoming is "add" (a re-add) or "update" — either way the row still
  // hasn't been created server-side, so it stays an `add`; `patch` is the
  // complete row, so this is a full replace.
  //
  // isEmptyRow applies only to the `update` case: an update that empties
  // an added row is the "clear it back out" gesture, and the row never
  // reached the server, so annihilating it is indistinguishable from
  // never adding it. A re-`add` is a deliberate creation and is never
  // annihilated by content.
  if (incoming.op === "update" && isEmptyRow?.(incoming.patch)) {
    return null;
  }
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
    // An existing `update` entry does not prove a real baseline row — the
    // label is forgeable by annihilation (see resolveOpAgainstBaseline) —
    // so resolve against the baseline map: keeping `add` here for a row
    // the server already has would instruct it to CREATE a duplicate
    // clinical record.
    const op = resolveOpAgainstBaseline(existing.rowId, baseline);
    return { rowId: existing.rowId, op, patch: incoming.patch };
  }
  // incoming is "update": replace the patch (always the complete row),
  // then canonicalize against baseline — the "edit-then-revert" case:
  // mild → moderate → mild must leave the section clean.
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
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): RowEdit<TRow> | null {
  if (incoming.op === "remove") {
    return existing;
  }
  // incoming is "add" or "update": a resurrection of a row carrying a
  // pending `remove`. The existing `remove` does not prove the rowId is a
  // server row — `add(u) → remove(u)` annihilates the pair (erasing u's
  // history from the log), and a second `remove(u)` then reaches
  // `appendFresh`, which appends unconditionally — so the outcome is
  // resolved against the baseline map: `add` if the rowId provably isn't
  // a server row, `update` (restore-and-patch) otherwise. Both incoming
  // ops resolve identically, by data.
  //
  // Deliberate asymmetry with coalesceOntoUpdate: a restore whose patch
  // deep-equals the baseline row still records an `update` instead of
  // dropping it — remove-then-restore-unchanged is not treated as
  // "never happened".
  const op = resolveOpAgainstBaseline(existing.rowId, baseline);
  return { rowId: existing.rowId, op, patch: incoming.patch };
}

/**
 * Decides what a resurrection/re-add op should BECOME, based on whether
 * the rowId is a row the server has — never on the op label the existing
 * entry or the incoming edit carries: annihilation erases a rowId's
 * history from the log, so both labels are forgeable (see the call sites
 * in `coalesceOntoRemove` and `coalesceOntoUpdate`). The baseline map is
 * the only source of truth consulted here.
 *
 * When `baseline` is not supplied there is genuinely no way to know, and
 * `"update"` is the documented, conservative fallback: a wrong `update`
 * surfaces as a loud 404/400, while a wrong `add` would silently create
 * a duplicate clinical row — data corruption, the worse failure. Every
 * real caller (via `useStructuredRows`) supplies the full map.
 */
function resolveOpAgainstBaseline<TRow extends object>(
  rowId: RowId,
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): "add" | "update" {
  if (baseline === undefined) return "update";
  return baseline.has(rowId) ? "update" : "add";
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

/**
 * Collapses a log to at most one edit per rowId: content follows the LAST
 * entry for a rowId, position its FIRST appearance. Identity for any log
 * `applyEditToLog` produced (one entry per rowId already), but a restored
 * draft's per-record validation admits duplicate rowIds the reducer never
 * emits — every consumer (`resolveChanges`, `findOrphanRowIds`) iterates
 * this so one identity is acted on exactly once.
 *
 * Pure: never mutates `log`; returns a fresh array.
 */
export function dedupeEditsFirstAppearance<TRow extends object>(
  log: EditLog<TRow>,
): readonly RowEdit<TRow>[] {
  // A Map keyed by rowId gives exactly these semantics: re-setting an
  // existing key keeps its original position and replaces its value.
  const editByRowId = new Map<RowId, RowEdit<TRow>>();
  for (const edit of log) editByRowId.set(edit.rowId, edit);
  return [...editByRowId.values()];
}
