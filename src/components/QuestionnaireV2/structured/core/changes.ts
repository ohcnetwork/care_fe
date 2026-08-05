import { dedupeEditsFirstAppearance } from "./editLog";
import type { EditLog, RowId, SoftDeleteDescriptor } from "./types";

/**
 * One row to remove on the server. `rowId` is always present; `row` is
 * present only when a `softDelete` descriptor was supplied to
 * {@link resolveChanges}. Unlike `creates`/`updates` entries, `row` is
 * always a fresh merge — it never aliases the edit's `patch`.
 */
export interface ResolvedRemove<TRow extends object> {
  rowId: RowId;
  /**
   * The soft-delete body: the edit's last-known row (`RowEdit.patch` on a
   * `remove` — "the row as it last read before removal," per
   * `structured.ts`'s `StructuredEditOp` doc) with `softDelete.patch`'s
   * marker fields merged on top, i.e. a complete upsert body a type with
   * marker-not-delete semantics can send as-is. Deliberately ABSENT (not
   * `undefined` — the key itself is omitted) when {@link resolveChanges}
   * was called with no `softDelete` descriptor: a type with real
   * delete-by-id semantics has no row content to send, only the id.
   */
  row?: TRow;
}

/**
 * An edit log resolved into the three sets every v2 type's
 * `toRequests(edits, ctx)` builds its batch bodies from — see
 * `resolveChanges`'s doc comment below for the full contract.
 */
export interface ResolvedChanges<TRow extends object> {
  /** New rows, in log order. An `add` edit's `patch` already IS the
   *  complete row; pushed by reference, not cloned (nothing downstream
   *  mutates a resolved row). An `add` whose `rowId` a supplied
   *  `options.baseline` already has is reclassified into `updates`. */
  creates: readonly TRow[];
  /** Existing rows to update, in log order — complete rows as they now
   *  read, by reference. An `add` reclassified here is its `patch`
   *  verbatim and may lack the server `id` a genuine update row carries —
   *  safe for URL-keyed endpoints (`encounter`, the only reachable case
   *  today), but a `toRequests` for a non-URL-keyed type must re-verify.
   */
  updates: readonly TRow[];
  /** Rows to remove, in log order. See {@link ResolvedRemove}. */
  removes: readonly ResolvedRemove<TRow>[];
}

export interface ResolveChangesOptions<TRow extends object> {
  /** How this type marks — instead of deletes — a row's removal. See
   *  `SoftDeleteDescriptor`'s doc comment (`./types`) for the full
   *  contract. Required to be passed explicitly (even as `{}` when there
   *  is none) rather than defaulted, so a type module's differ makes the
   *  "does this type soft-delete?" call on purpose at every call site,
   *  not by omission. */
  softDelete?: SoftDeleteDescriptor<TRow>;
  /**
   * rowId → the unedited server row: the COMPLETE fetched server-row set,
   * or `undefined` while it is unknown (loading/errored) — never a
   * partial map.
   *
   * When supplied, an `update`/`remove` whose `rowId` it lacks is an
   * orphan — intent about a row the server no longer has (typically a
   * restored draft), or a `remove` for a rowId that never reached the
   * server. Orphans are dropped entirely, matching `projectRows`' orphan
   * rule; an `add` is never an orphan. When `undefined`, every edit is
   * trusted and dispatched — a documented, conservative fallback, not a
   * guarantee that no orphan reaches the wire.
   */
  baseline?: ReadonlyMap<RowId, TRow>;
}

/**
 * Resolves one edit log into the create/update/remove sets a type's
 * `toRequests(edits, ctx)` sends over the wire. An empty log yields three
 * empty arrays regardless of `baseline` — a clinician who never touched a
 * section sends zero requests for it, by construction.
 *
 * Pure and total: never mutates `log` or `options`; always returns fresh
 * arrays.
 *
 * Op semantics stop here: this realizes the log's add/update/remove
 * INTENT; whether a given wire call actually creates or updates
 * server-side is each type's `toRequests` contract (the real endpoints
 * are upserts that may create instead of failing on an unrecognized id).
 *
 * A malformed log with duplicate rowIds (never produced by the reducer,
 * but admitted by a restored draft's per-record validation) is
 * de-duplicated last-write-wins per rowId and dispatched once, at first
 * appearance — otherwise `[add("dup", a), add("dup", b)]` would dispatch
 * two creates for one identity.
 *
 * An `add` whose rowId `baseline` already contains is reclassified into
 * `updates`: the reducer keeps `op: "add"` for edits recorded while the
 * baseline query was still loading, and emitting a create for a row the
 * server already has would silently duplicate a clinical record. The
 * reclassified row is the add's `patch` verbatim — see
 * {@link ResolvedChanges.updates} for why it may lack a server `id`.
 *
 * A `remove` can name a rowId that never reached the server (add→remove
 * annihilates the pair and erases its history; a second remove then
 * appends fresh). With `softDelete` configured, trusting that op would
 * POST a soft-delete body to an upsert endpoint that CREATES a phantom
 * row already marked entered-in-error — hence the orphan check against
 * `baseline`; see {@link ResolveChangesOptions.baseline}.
 */
export function resolveChanges<TRow extends object>(
  log: EditLog<TRow>,
  options: ResolveChangesOptions<TRow>,
): ResolvedChanges<TRow> {
  const { softDelete, baseline } = options;

  const creates: TRow[] = [];
  const updates: TRow[] = [];
  const removes: ResolvedRemove<TRow>[] = [];

  for (const resolved of dedupeEditsFirstAppearance(log)) {
    const isOrphan =
      resolved.op !== "add" &&
      baseline !== undefined &&
      !baseline.has(resolved.rowId);
    if (isOrphan) continue; // see ResolveChangesOptions.baseline's doc comment

    switch (resolved.op) {
      case "add":
        // Baseline already has this rowId — creating it again would
        // duplicate a server row, so it dispatches as an update.
        (baseline?.has(resolved.rowId) ? updates : creates).push(
          resolved.patch,
        );
        break;
      case "update":
        updates.push(resolved.patch);
        break;
      case "remove":
        removes.push(
          softDelete
            ? {
                rowId: resolved.rowId,
                row: { ...resolved.patch, ...softDelete.patch },
              }
            : { rowId: resolved.rowId },
        );
        break;
      // No default: an unrecognized op (reachable only via a cast — draft
      // validation rejects unknown op strings) is deliberately dropped
      // from every set. An op outside the closed vocabulary says nothing
      // this function can act on.
    }
  }

  return { creates, updates, removes };
}
