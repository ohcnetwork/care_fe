import type { EditLog, RowEdit, RowId, SoftDeleteDescriptor } from "./types";

/**
 * One row to remove on the server. `rowId` is always present; `row` is
 * present only when a `softDelete` descriptor is supplied to
 * {@link resolveChanges} — see that function's doc comment for exactly
 * what it carries and why.
 *
 * ALIASING NOTE (unlike `creates`/`updates` — see `ResolvedChanges`'s doc
 * comment): `row`, when present, is always a FRESH object — a merge of
 * the edit's `patch` and the descriptor's marker fields, neither of which
 * it can alias. There is no bare-row case to alias in the first place:
 * the only two shapes are "freshly merged" and "absent."
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
   *  resolve beyond sorting by op. ALIASING NOTE: this is the edit's own
   *  `patch` object, by reference — not a clone. Consistent with the rest
   *  of this pure core (`editLog.ts`'s coalescing reuses `incoming.patch`
   *  the same way): nothing downstream is expected to mutate a resolved
   *  row, so aliasing costs nothing and avoids a needless copy. Contrast
   *  `ResolvedRemove.row`, which — when present — is always a fresh merge
   *  and cannot alias either of its two source objects. */
  creates: readonly TRow[];
  /** Existing rows to update, in log order. Each is the complete row as it
   *  now reads (baseline row with the clinician's fields applied) — same
   *  reasoning and the same aliasing note as `creates`. */
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
   * rowId → the unedited server row — the SAME map `applyEditToLog`
   * (`editLog.ts`) and `projectRows` are given, per the plan's BASELINE
   * COMPLETENESS CONTRACT (`2026-08-04-phase1-core-kit.md`'s Global
   * Constraints): **the complete fetched server-row set, or `undefined`
   * — never a partial map**. A partial map is a caller error, not a
   * "not yet loaded" signal; Task 7 must pass `undefined`, never `[]`/an
   * empty map, while the baseline query is loading or errored.
   *
   * When supplied, an `update` or `remove` whose `rowId` is absent from
   * it is an ORPHAN — intent about a row the (complete) baseline does not
   * contain, typically a restored draft whose server row vanished between
   * sessions, or (see the POST-REVIEW FIX note on {@link resolveChanges})
   * a `remove` the reducer appended fresh for a rowId that never reached
   * the server in the first place. Dropped from the result entirely, not
   * reported and not dispatched — exactly `projectRows`' orphan rule
   * (`projectRows.ts:144-160`; an `add` is never treated as an orphan,
   * matching that same rule, since an add is inherently absent from
   * baseline by definition).
   *
   * When `undefined`, there is genuinely nothing to check an edit's
   * `rowId` against, and this function does not pretend otherwise: every
   * edit in the log is trusted and dispatched, undropped, as a
   * documented, conservative fallback — not a guarantee that no orphan
   * can reach the wire. This is the same shape of fallback
   * `resolveOpAgainstBaseline` documents in `editLog.ts` (lines 255-261):
   * every real caller (`useStructuredRows`, per the BASELINE COMPLETENESS
   * CONTRACT) supplies the complete map or `undefined`, never omits the
   * option while intending partial data, so this branch exists for a
   * caller that doesn't supply it at all, not as the expected path.
   */
  baseline?: ReadonlyMap<RowId, TRow>;
}

/**
 * Resolves one edit log into the create/update/remove sets a type's
 * `toRequests(edits, ctx)` sends over the wire. This is the P1-14
 * guarantee — "a clinician who never touched a section sends zero
 * requests for it" — in its purest, most literal form:
 * `resolveChanges([], {})` returns three empty arrays, by construction,
 * regardless of whatever `options.baseline` says exists on the server
 * (a non-empty baseline can never manufacture a request on its own —
 * `changes.test.ts`'s "P1-14 EXTENDED" case). There is no code path here
 * that can emit anything for a rowId the log never mentions; today
 * allergy/symptom/medication-statement's legacy `buildRequests` submits
 * every prefetched row regardless (`definitions/symptom.tsx:41` maps over
 * the WHOLE projection, not the edit log), which is exactly the
 * concurrent-edit clobber this differ exists to retire.
 *
 * Pure and total: never mutates `log`, `options.softDelete`, or
 * `options.baseline` (or anything reachable from any of them), and always
 * returns fresh arrays.
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
 * does not decide whether a given wire call will actually create or
 * update server-side. The real endpoints are upserts that may create
 * instead of failing on an unrecognized id (`definitions/symptom.tsx`
 * POSTs whole rows to `/symptom/upsert/`); whatever the wire does with a
 * `creates` or `updates` entry is each type's `toRequests` contract, not
 * asserted here.
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
 * POST-REVIEW FIX — a `remove` for a rowId that never touched the server.
 * An earlier version of this function claimed `editLog.ts`'s reducer
 * guarantees a `remove` can only ever reach a well-formed log for a real
 * baseline row ("an added-then-removed row is always annihilated"). That
 * claim is FALSE, and `editLog.ts` itself documents the exact counter-
 * sequence (its `coalesceOntoRemove` doc comment, "FIX (post-review)"
 * paragraph): `add(u)` → `remove(u)` annihilates the pair (log empty,
 * history erased) → a SECOND `remove(u)` then reaches `appendFresh`, which
 * appends a brand-new `remove` entry unconditionally (it never checks
 * `baseline` for a `remove`) — so a rowId that never reached the server
 * CAN appear in a well-formed log with `op: "remove"`. Trusting that op
 * unconditionally (the old behavior) meant that, with a `softDelete`
 * descriptor configured, this function would emit a soft-delete body
 * built from a patch that — because the row was only ever an `add`, never
 * a real server row — carries no server `id`. Posted to an upsert
 * endpoint that may create rather than fail on an unrecognized id, that
 * silently CREATES a brand-new row already marked entered-in-error: the
 * exact duplicate/phantom-record failure Task 3's `resolveOpAgainstBaseline`
 * fix exists to prevent, reintroduced at this last hop. Reproduced via the
 * real reducer in `changes.test.ts`'s "REGRESSION (review finding 1)" case
 * before being fixed.
 *
 * Fixed the same way Task 3 fixed the identical shape of problem: by
 * consulting `options.baseline` instead of trusting a `remove` op's mere
 * presence. See {@link ResolveChangesOptions.baseline}'s doc comment for
 * the full orphan-drop rule and its documented fallback when no baseline
 * is supplied at all.
 *
 * POST-REVIEW FIX — last-write-wins per rowId before dispatching. An
 * earlier version dispatched every entry in `log` independently, with no
 * de-duplication by `rowId`. `applyEditToLog` (`editLog.ts`) guarantees at
 * most one entry per `rowId` for any log IT produces, but a restored
 * draft's per-record `isStructuredEditRecord` gate (`structured.ts`)
 * validates each entry independently and would happily accept two
 * malformed entries sharing a `rowId` — the same shape of corruption
 * `projectRows.ts:175-176`'s `editByRowId` map already defends against.
 * Without de-duplication, `[add("dup", first), add("dup", second)]` would
 * dispatch TWO creates for one identity instead of one. Fixed with the
 * same map `projectRows.ts` uses (`Map<RowId, RowEdit<TRow>>`, built by
 * iterating `log` once and overwriting — the last entry per `rowId`
 * wins), then a single forward pass over `log` that dispatches each
 * `rowId` exactly once, at its FIRST appearance, using the map's
 * (last-written) content: content and the op that decides which set it
 * lands in both follow the LAST entry for that `rowId`; the POSITION in
 * the dispatched order follows the FIRST. For a well-formed log (one
 * entry per `rowId`, the only shape the real reducer ever produces) first
 * and last appearance are the same position, so this is invisible in the
 * normal path — it only changes behavior for an already-malformed input.
 * Tested in `changes.test.ts`'s "REGRESSION (review finding 2)" cases.
 */
export function resolveChanges<TRow extends object>(
  log: EditLog<TRow>,
  options: ResolveChangesOptions<TRow>,
): ResolvedChanges<TRow> {
  const { softDelete, baseline } = options;

  // Last write wins per rowId — mirrors projectRows.ts:175-176.
  const editByRowId = new Map<RowId, RowEdit<TRow>>();
  for (const edit of log) editByRowId.set(edit.rowId, edit);

  const creates: TRow[] = [];
  const updates: TRow[] = [];
  const removes: ResolvedRemove<TRow>[] = [];

  const dispatched = new Set<RowId>();
  for (const edit of log) {
    if (dispatched.has(edit.rowId)) continue; // resolved at first appearance
    dispatched.add(edit.rowId);
    // Non-null: this rowId came from `log`, so `editByRowId` has an entry.
    const resolved = editByRowId.get(edit.rowId) as RowEdit<TRow>;

    const isOrphan =
      resolved.op !== "add" &&
      baseline !== undefined &&
      !baseline.has(resolved.rowId);
    if (isOrphan) continue; // see ResolveChangesOptions.baseline's doc comment

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
      // No default: an unrecognized op (reachable only via a cast — a
      // validated draft's isStructuredEditRecord gate already rejects an
      // unknown op string) is silently dropped from every set. Correct,
      // not merely unhandled: this function's contract is "dispatch what
      // the log says," and an op outside the closed vocabulary says
      // nothing this function can act on. Tested in `changes.test.ts`.
    }
  }

  return { creates, updates, removes };
}
