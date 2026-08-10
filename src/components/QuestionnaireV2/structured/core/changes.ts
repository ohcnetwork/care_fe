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
   *  mutates a resolved row). */
  creates: readonly TRow[];
  /** Existing rows to update, in log order — complete rows as they now
   *  read, by reference. */
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
}

/**
 * Resolves one edit log into the create/update/remove sets a type's
 * `toRequests(edits, ctx)` sends over the wire. An empty log yields three
 * empty arrays — a clinician who never touched a section sends zero
 * requests for it, by construction.
 *
 * Pure and total: never mutates `log` or `options`; always returns fresh
 * arrays.
 *
 * Op semantics stop here: this realizes the log's add/update/remove
 * INTENT; whether a given wire call actually creates or updates
 * server-side is each type's `toRequests` contract (the real endpoints
 * are upserts that may create instead of failing on an unrecognized id).
 *
 * The log is trusted to hold at most one entry per rowId: every log a
 * type's `toRequests` receives has passed `sanitizeStructuredEditLog`
 * (the submit path's read gate in `composeStructured.ts`), which
 * collapses the duplicate rowIds a restored draft could carry, and
 * `applyEditToLog` never produces them.
 *
 * Stale intent is likewise resolved before this function runs:
 * `useStructuredRows`' orphan prune excises edits whose baseline row
 * vanished server-side at the one seam where `baseline` and `edits`
 * coexist, so no baseline is available — or needed — here.
 */
export function resolveChanges<TRow extends object>(
  log: EditLog<TRow>,
  options: ResolveChangesOptions<TRow>,
): ResolvedChanges<TRow> {
  const { softDelete } = options;

  const creates: TRow[] = [];
  const updates: TRow[] = [];
  const removes: ResolvedRemove<TRow>[] = [];

  for (const resolved of log) {
    switch (resolved.op) {
      case "add":
        creates.push(resolved.patch);
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
