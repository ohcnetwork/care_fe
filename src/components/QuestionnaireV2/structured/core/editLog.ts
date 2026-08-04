import { deepEqualJson } from "./deepEqual";
import type { EditLog, RowEdit, RowId } from "./types";

/**
 * Options for {@link applyEditToLog}. Signature per task-3-brief.md /
 * annex `p1-state-core.md` §6, translated: the annex's draft
 * `ApplyEditOptions` also carries an `isEmptyRow` hook for annihilating an
 * added-then-emptied row (`AppointmentQuestion.tsx:144-153`-style,
 * annex §6's `add`+`update` cell — NOT §7, which never mentions it; §7 is
 * `removeRow`'s three-outcome dispatch, a different concern). It is
 * omitted here as a CARRY-FORWARD, not because it belongs elsewhere: the
 * plan wires it from `useStructuredRows` (Task 7,
 * `2026-08-04-phase1-core-kit.md` line 217 — "`isEmptyRow` annihilates an
 * emptied added row"), which means this file WILL be reopened to accept
 * and act on it. Not listed among task-3's required coalescing rules, so
 * deferred rather than guessed at now. See task-3-report.md for the note.
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
 * | `update`  | **resolved against `baseline`** — `add` if the rowId provably isn't in it, else replace patch and stay `update` | replace patch, canonicalize against baseline, **drop if reverted** | replace with `remove` |
 * | `remove`  | **resolved against `baseline`** — `add` if the rowId provably isn't in it, else `update` (restore-and-patch) | same resolution as the `add` column | keep `remove` (idempotent) |
 *
 * The `update`/`remove` existing-row cells that read "resolved against
 * `baseline`" do NOT trust "this entry's existing op" or "the incoming
 * edit's op" as a proxy for "is this rowId really on the server" — both
 * are forgeable by annihilation (see `resolveOpAgainstBaseline`'s doc
 * comment for the exact sequences that forge them). The baseline map is
 * the only source of truth consulted there.
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
      return coalesceOntoRemove(existing, incoming, baseline);
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
    // FIX (post-review): the annex's draft cell for this ("replace patch,
    // stays `add`") assumed an existing `update` entry always implies a
    // real baseline row. That assumption doesn't hold — see
    // `resolveOpAgainstBaseline`'s doc comment — so this is resolved
    // against the baseline map instead of trusting either op label.
    // Without the fix: `baseline={server-9}`, `update(server-9)` then
    // `add(server-9)` produced `{op:"add"}` — an instruction to CREATE a
    // row the server already has, i.e. a duplicate clinical record.
    const op = resolveOpAgainstBaseline(existing.rowId, baseline);
    return { rowId: existing.rowId, op, patch: incoming.patch };
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
  baseline: ReadonlyMap<RowId, TRow> | undefined,
): RowEdit<TRow> | null {
  if (incoming.op === "remove") {
    // Idempotent — keep the existing remove untouched.
    return existing;
  }
  // incoming is "add" or "update": a legal resurrection of a row that
  // carried a pending `remove`.
  //
  // FIX (post-review): this used to assume that reaching this branch at
  // all PROVES the rowId is a baseline row, reasoning that "an added
  // row's remove is annihilated, never leaving a `remove` entry — so a
  // `remove` entry here can only have come from a baseline row". That
  // invariant is false: annihilation ERASES the rowId's history from the
  // log, not from existence. `add(u) → remove(u)` (annihilated, log
  // empty) → `remove(u)` again reaches `appendFresh`, which appends a
  // brand-new `remove` entry for `u` unconditionally (it never checks
  // baseline for a `remove`) — so a rowId that never touched the server
  // can absolutely arrive here with an existing `remove` entry. A
  // following `add(u)` would then have been "resurrected" as `update`
  // against a row the server never had. (The same erasure is reachable
  // via a stray `update(u)` landing after the drop — a debounced field
  // flush or an assistant edit queued before the removal — which lands
  // in `coalesceOntoUpdate`'s `add` branch instead; both are fixed the
  // same way, by `resolveOpAgainstBaseline`.)
  //
  // Resolved against the baseline map instead: `add` if the rowId
  // provably isn't a server row, `update` (restore-and-patch) otherwise.
  //
  // TRANSLATION FROM THE ANNEX, still holding: `p1-state-core.md` §6's
  // table drafts the incoming-`add` cell as "replace with `add`"
  // unconditionally and the incoming-`update` cell as "replace with
  // `update`" — two different outcomes for the same resurrection. Under
  // the shipped canonical vocabulary a stable, already-known `rowId`
  // makes that op-label distinction meaningless (see task-3-report.md);
  // both incoming ops now resolve identically, by data.
  //
  // NOTED, NOT FIXED — a deliberate asymmetry with `coalesceOntoUpdate`:
  // when the resolved op is `update` and the incoming patch happens to
  // deep-equal the baseline row exactly, this still records an `update`
  // entry rather than dropping it (unlike `update`→`update`, which drops
  // via `isRevertedToBaseline`). A remove-then-restore-unchanged is not
  // treated as "never happened" here. Left as-is per review: task-3's
  // brief only specifies "ONE update" for this cell, no canonicalization
  // is requested, and the review flagged this as a note-don't-change item
  // rather than a defect.
  const op = resolveOpAgainstBaseline(existing.rowId, baseline);
  return { rowId: existing.rowId, op, patch: incoming.patch };
}

/**
 * Decides what a resurrection/re-add op should actually BECOME, based on
 * whether the rowId is a row the server has — never on which op label the
 * existing log entry or the incoming edit happens to carry. Both call
 * sites below turned out to be forgeable if the op label is trusted
 * instead:
 *
 *  - `coalesceOntoRemove` (existing entry is `remove`): reachable for a
 *    rowId that never touched the server — see the FIX note there for
 *    the exact `add → remove (annihilated) → remove → add` sequence.
 *  - `coalesceOntoUpdate`'s `add` branch (existing entry is `update`):
 *    reachable the same way, one hop earlier — `add(u) → remove(u)`
 *    (annihilated) → a stray `update(u)` lands (debounced flush /
 *    assistant edit queued before the removal, arriving after) appends a
 *    fresh `update` entry via `appendFresh` for a rowId baseline never
 *    had; a later `add(u)` then reaches this same decision point.
 *
 * So neither "the existing entry's op" nor "the incoming edit's op" is a
 * reliable proxy for "this rowId is on the server" — the baseline map is
 * the only source of truth consulted here.
 *
 * When `baseline` is not supplied at all, there is genuinely no way to
 * know, and this does NOT claim to: it returns `"update"` as a
 * documented, conservative fallback — not a guarantee. A wrongly emitted
 * `update` against a rowId the server doesn't have surfaces as a loud
 * 404/400 from the differ's request; a wrongly emitted `add` would
 * instead silently create a duplicate clinical row, the worse failure
 * mode (data corruption, not a rejected request). Every real caller (via
 * `useStructuredRows`) supplies the full baseline map, so this branch is
 * a defensive fallback for a caller that doesn't, not the expected path.
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
