import type { EditLog, RowId, SoftDeleteDescriptor } from "./types";

/**
 * One row to remove on the server. `rowId` is always present; `row` is
 * present only when a `softDelete` descriptor is supplied to
 * {@link resolveChanges} — see that function's doc comment for exactly
 * what it carries and why.
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
  /** New rows, in log order. Each is the complete row to create — under
   *  the canonical vocabulary an `add` edit's `patch` already IS the row
   *  (`structured.ts`'s `StructuredEditOp` doc), so there is nothing to
   *  resolve beyond sorting by op. */
  creates: readonly TRow[];
  /** Existing rows to update, in log order. Each is the complete row as it
   *  now reads (baseline row with the clinician's fields applied) — same
   *  reasoning as `creates`. */
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
 * `toRequests(edits, ctx)` sends over the wire. This is the P1-14
 * guarantee — "a clinician who never touched a section sends zero
 * requests for it" — in its purest, most literal form:
 * `resolveChanges([], {})` returns three empty arrays, by construction.
 * There is no code path here that can emit anything for a rowId the log
 * never mentions; today allergy/symptom/medication-statement's legacy
 * `buildRequests` submits every prefetched row regardless (`definitions/
 * symptom.tsx:41` maps over the WHOLE projection, not the edit log), which
 * is exactly the concurrent-edit clobber this differ exists to retire.
 *
 * Pure and total: never mutates `log` (or anything reachable from it) or
 * `options.softDelete`, and always returns fresh arrays.
 *
 * WHY THIS SIGNATURE DROPS THE ANNEX'S `rowIdOf` / PROJECTION LOOKUP.
 * `annexes/p1-state-core.md` §11 drafts `resolveChanges(input:
 * StructuredEditInputFor<TRow>, rowIdOf: (row: TRow) => RowId | undefined):
 * RowChange<TRow>[]` — a single flat, op-tagged array, with `update`
 * entries resolved by looking their `rowId` up in `input.projection` via
 * `rowIdOf`. That lookup exists in the annex ONLY because it was drafted
 * against the OLD edit vocabulary, where an `update`'s patch was a
 * `Partial<TRow>` field diff — the full row had to come from somewhere
 * else, hence the projection argument. Under the SHIPPED canonical
 * vocabulary (`structured.ts`'s `StructuredEditOp` doc, restated in the
 * plan's CANONICAL EDIT VOCABULARY table), `patch` is ALWAYS the complete
 * row, for `add` and `update` alike — so the row `resolveChanges` needs is
 * already sitting on the edit itself. No projection, no `rowIdOf`
 * callback, no lookup that could miss: this function's signature is
 * exactly `(log, options) => ResolvedChanges`, per the plan's Task 5
 * "Produces" line (`2026-08-04-phase1-core-kit.md:178`), which is what's
 * implemented here — not the annex's draft, translated per that plan's
 * own reconciliation section. The plan also splits the annex's one
 * flat `RowChange[]` into three named sets (`creates`/`updates`/`removes`)
 * — the commit this ships under is literally "resolve an edit log into
 * create/update/remove sets" — so a type's `toRequests` combines them
 * however its own endpoint shape requires (symptom's single upsert body
 * is `[...creates, ...updates]`; a type with a real delete endpoint routes
 * `removes` there separately).
 *
 * OP SEMANTICS STOP HERE (binding project constraint). This function
 * realizes the log's `add`/`update`/`remove` INTENT into three sets; it
 * does not — and structurally cannot, since it never receives a baseline
 * map — decide whether a given wire call will actually create or update
 * server-side. The real endpoints are upserts that may create instead of
 * failing on an unrecognized id (`definitions/symptom.tsx` POSTs whole
 * rows to `/symptom/upsert/`); whatever the wire does with a `creates` or
 * `updates` entry is each type's `toRequests` contract, not asserted here.
 *
 * JUDGMENT CALL — the soft-delete body vs. the bare rowId. `removes`
 * carries `{ rowId, row: {...edit.patch, ...softDelete.patch} }` when
 * `options.softDelete` is supplied (a complete upsert body marking the row
 * entered-in-error — coherent with `SoftDeleteDescriptor.patch` being
 * "just the marker fields... on top of the row's existing values," per
 * its doc comment in `./types`), and `{ rowId }` alone — no `row` key at
 * all — when it is not (nothing but the id is needed for a real
 * delete-by-id call). Both are tested in `changes.test.ts`.
 *
 * JUDGMENT CALL — a `remove` for a rowId that never touched the server.
 * `resolveChanges`'s signature carries no baseline map, unlike
 * `projectRows` (which receives one and uses it to drop exactly this
 * shape defensively). Without a baseline, this function has no way to
 * tell "this rowId was never on the server" apart from "this rowId was on
 * the server and is now removed" — both look identical from inside a
 * `remove` edit alone. Rather than guess, it trusts the log: every
 * `remove` op it is handed lands in `removes`, unconditionally. This is
 * safe because the upstream invariant already holds by construction —
 * `editLog.ts`'s reducer annihilates an added-then-removed row
 * (`coalesceOntoAdd`'s `remove` branch) before it can ever survive into a
 * log produced by `applyEditToLog`, so a `remove` reaching a well-formed
 * log always denotes a real baseline row. A caller that hand-builds a log
 * outside the reducer and includes a phantom `remove` anyway will still
 * see it surface here — that is a caller error to avoid upstream, not
 * something this pure function is positioned (or has the input) to
 * detect. Tested in `changes.test.ts`.
 */
export function resolveChanges<TRow extends object>(
  log: EditLog<TRow>,
  options: ResolveChangesOptions<TRow>,
): ResolvedChanges<TRow> {
  const { softDelete } = options;

  const creates: TRow[] = [];
  const updates: TRow[] = [];
  const removes: ResolvedRemove<TRow>[] = [];

  for (const edit of log) {
    switch (edit.op) {
      case "add":
        creates.push(edit.patch);
        break;
      case "update":
        updates.push(edit.patch);
        break;
      case "remove":
        removes.push(
          softDelete
            ? {
                rowId: edit.rowId,
                row: { ...edit.patch, ...softDelete.patch },
              }
            : { rowId: edit.rowId },
        );
        break;
    }
  }

  return { creates, updates, removes };
}
