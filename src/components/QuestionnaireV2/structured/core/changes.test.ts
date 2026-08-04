import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SymptomRequest } from "@/types/emr/symptom/symptom";

import { resolveChanges } from "./changes";
import { applyEditToLog } from "./editLog";
import { SINGLETON_ROW_ID } from "./rowIds";
import type { EditLog, RowEdit, RowId, SoftDeleteDescriptor } from "./types";

/**
 * A small, deliberately generic row shape for the structural cases (op
 * routing, ordering, purity) — contrast the `SymptomRequest` fixture below,
 * used where the case is shape-sensitive (the soft-delete marker field).
 * Mirrors the fixture style in `editLog.test.ts` / `projectRows.test.ts`.
 */
interface TestRow {
  id: string;
  label: string;
}

function row(id: string, label: string): TestRow {
  return { id, label };
}

function add<TRow extends object>(rowId: RowId, patch: TRow): RowEdit<TRow> {
  return { rowId, op: "add", patch };
}
function update<TRow extends object>(rowId: RowId, patch: TRow): RowEdit<TRow> {
  return { rowId, op: "update", patch };
}
function remove<TRow extends object>(rowId: RowId, patch: TRow): RowEdit<TRow> {
  return { rowId, op: "remove", patch };
}

function baselineOf(
  entries: ReadonlyArray<readonly [RowId, TestRow]>,
): ReadonlyMap<RowId, TestRow> {
  return new Map(entries);
}

// Realistic row fixture, per the task brief's soft-delete case — see
// src/types/emr/symptom/symptom.ts. Mirrors projectRows.test.ts's helper.
function makeSymptomRow(
  overrides: Partial<SymptomRequest> = {},
): SymptomRequest {
  return {
    id: "symptom-1",
    clinical_status: "active",
    verification_status: "confirmed",
    code: { system: "system-condition-code", code: "R05", display: "Cough" },
    severity: "moderate",
    onset: { onset_datetime: "2026-01-01" },
    recorded_date: "2026-01-01",
    note: "worse at night",
    encounter: "encounter-1",
    category: "problem_list_item",
    ...overrides,
  };
}

describe("resolveChanges — edit log resolved into create/update/remove sets", () => {
  it("P1-14 PIN: an empty log resolves to three empty sets — a clinician who never touched the section sends zero requests for it", () => {
    const result = resolveChanges<TestRow>([], {});

    assert.deepEqual(result, { creates: [], updates: [], removes: [] });
  });

  it("P1-14 EXTENDED: a non-empty baseline with an empty log ALSO resolves to three empty sets — existence of server data alone must never manufacture a request", () => {
    const baseline = baselineOf([
      ["r1", row("r1", "real")],
      ["r2", row("r2", "also real")],
    ]);

    const result = resolveChanges<TestRow>([], { baseline });

    assert.deepEqual(result, { creates: [], updates: [], removes: [] });
  });

  it("an add lands in creates, carrying the full new row (the row IS the patch)", () => {
    const log: EditLog<TestRow> = [add("new-1", row("new-1", "fresh"))];

    const result = resolveChanges(log, {});

    assert.deepEqual(result.creates, [row("new-1", "fresh")]);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.removes, []);
  });

  it("a baseline update lands in updates, carrying the full row as it now reads", () => {
    const log: EditLog<TestRow> = [update("r1", row("r1", "changed"))];

    const result = resolveChanges(log, {});

    assert.deepEqual(result.updates, [row("r1", "changed")]);
    assert.deepEqual(result.creates, []);
    assert.deepEqual(result.removes, []);
  });

  it("a remove with no softDelete descriptor lands in removes carrying the BARE rowId — nothing else is needed for a real delete-by-id", () => {
    const log: EditLog<TestRow> = [remove("r1", row("r1", "gone"))];

    const result = resolveChanges(log, {});

    assert.deepEqual(result.removes, [{ rowId: "r1" }]);
    // Not merely `row: undefined` — the key itself must be absent, since a
    // hard-delete differ has no row content to send at all.
    assert.equal("row" in result.removes[0], false);
  });

  it("a remove with a softDelete descriptor lands in removes carrying the soft-delete BODY — the last-known row with the descriptor's marker fields merged on top", () => {
    const lastKnown = makeSymptomRow({
      id: "s1",
      verification_status: "confirmed",
    });
    const log: EditLog<SymptomRequest> = [remove("s1", lastKnown)];
    const softDelete: SoftDeleteDescriptor<SymptomRequest> = {
      patch: { verification_status: "entered_in_error" },
      isDeleted: (r) => r.verification_status === "entered_in_error",
    };

    const result = resolveChanges(log, { softDelete });

    assert.deepEqual(result.removes, [
      {
        rowId: "s1",
        row: { ...lastKnown, verification_status: "entered_in_error" },
      },
    ]);
  });

  it("ordering within each set follows the log's order — deterministic batches", () => {
    const log: EditLog<TestRow> = [
      add("a1", row("a1", "add-1")),
      update("u1", row("u1", "update-1")),
      remove("r1", row("r1", "remove-1")),
      add("a2", row("a2", "add-2")),
      remove("r2", row("r2", "remove-2")),
      update("u2", row("u2", "update-2")),
    ];

    const result = resolveChanges(log, {});

    assert.deepEqual(result.creates, [row("a1", "add-1"), row("a2", "add-2")]);
    assert.deepEqual(result.updates, [
      row("u1", "update-1"),
      row("u2", "update-2"),
    ]);
    assert.deepEqual(
      result.removes.map((r) => r.rowId),
      ["r1", "r2"],
    );
  });

  describe("options.baseline — orphan-drop rule (mirrors projectRows' orphan rule)", () => {
    it("an update targeting a rowId absent from a supplied baseline is dropped entirely — not sent, not reported", () => {
      const baseline = baselineOf([["other", row("other", "survives")]]);
      const log: EditLog<TestRow> = [
        update("vanished-1", row("vanished-1", "stale restored intent")),
      ];

      const result = resolveChanges(log, { baseline });

      assert.deepEqual(result.updates, []);
    });

    it("a remove targeting a rowId absent from a supplied baseline is dropped entirely — no soft-delete body, no bare rowId either", () => {
      const baseline = baselineOf([["r1", row("r1", "real")]]);
      const log: EditLog<TestRow> = [
        remove("ghost", row("ghost", "never existed")),
      ];
      const softDelete: SoftDeleteDescriptor<TestRow> = {
        patch: {},
        isDeleted: () => false,
      };

      const result = resolveChanges(log, { baseline, softDelete });

      assert.deepEqual(result.removes, []);
    });

    it("an add is NEVER treated as an orphan, even though its rowId is (correctly) absent from baseline — an add is inherently a row baseline doesn't have yet", () => {
      const baseline = baselineOf([["r1", row("r1", "real")]]);
      const log: EditLog<TestRow> = [add("new-1", row("new-1", "fresh"))];

      const result = resolveChanges(log, { baseline });

      assert.deepEqual(result.creates, [row("new-1", "fresh")]);
    });

    it("JUDGMENT CALL / documented fallback: with NO baseline supplied at all, an update or remove for any rowId is trusted and dispatched — resolveChanges cannot check what it isn't given", () => {
      const log: EditLog<TestRow> = [
        update("mystery", row("mystery", "restored intent")),
      ];

      const result = resolveChanges(log, {});

      assert.deepEqual(result.updates, [row("mystery", "restored intent")]);
    });
  });

  describe("REGRESSION (review finding 1) — a remove for a row that never touched the server must not reach the wire as a phantom soft-delete create", () => {
    it("the exact executed sequence: add(client-only) -> remove (annihilates) -> remove (appends fresh) still drops out of removes once a complete baseline is supplied", () => {
      // Reproduces editLog.ts's own "FIX (post-review)" note on
      // `coalesceOntoRemove`: annihilation erases a rowId's LOG HISTORY,
      // not its existence — a second `remove` for the same rowId reaches
      // `appendFresh`, which appends unconditionally (it never consults
      // baseline for a `remove`). So a rowId that never reached the
      // server CAN surface in a well-formed log with `op: "remove"`.
      const baseline = baselineOf([["someone-else", row("someone-else", "x")]]);
      const clientOnlyId = "client-only-uuid";

      const afterAdd = applyEditToLog(
        [],
        add(clientOnlyId, row(clientOnlyId, "v1")),
        { baseline },
      );
      const afterFirstRemove = applyEditToLog(
        afterAdd,
        remove(clientOnlyId, row(clientOnlyId, "v1")),
        { baseline },
      );
      assert.deepEqual(afterFirstRemove, []); // annihilated — sanity check

      const log = applyEditToLog(
        afterFirstRemove,
        remove(clientOnlyId, row(clientOnlyId, "v2")),
        { baseline },
      );
      // Sanity check: the reducer really did append a fresh `remove` for a
      // rowId `baseline` never had — this is the false-invariant shape.
      assert.deepEqual(log, [remove(clientOnlyId, row(clientOnlyId, "v2"))]);

      const softDelete: SoftDeleteDescriptor<TestRow> = {
        patch: { label: "entered-in-error-marker" },
        isDeleted: (r) => r.label === "entered-in-error-marker",
      };

      const result = resolveChanges(log, { baseline, softDelete });

      // Dropped as an orphan — NOT a soft-delete body with a client-only
      // patch and no server id, which would silently create a phantom
      // entered-in-error row against an upsert-that-may-create endpoint.
      assert.deepEqual(result.removes, []);
      assert.deepEqual(result.creates, []);
      assert.deepEqual(result.updates, []);
    });
  });

  describe("REGRESSION (review finding 2) — last-write-wins per rowId before dispatching", () => {
    it("two `add` entries for the same rowId (a malformed restored draft — each record passes isStructuredEditRecord independently) resolve to ONE create, holding the LAST patch", () => {
      const log: EditLog<TestRow> = [
        add("dup", row("dup", "first")),
        add("dup", row("dup", "second")),
      ];

      const result = resolveChanges(log, {});

      assert.deepEqual(result.creates, [row("dup", "second")]);
    });

    it("a stale `add` followed later by an `update` for the same rowId resolves via the LAST entry's op — dispatched as an update, not a create; position follows FIRST appearance", () => {
      const log: EditLog<TestRow> = [
        add("dup", row("dup", "stale-add")),
        update("other", row("other", "unrelated")),
        update("dup", row("dup", "fresh-update")),
      ];

      const result = resolveChanges(log, {});

      assert.deepEqual(result.creates, []); // reclassified by the last write
      assert.deepEqual(result.updates, [
        row("dup", "fresh-update"), // "dup" first appears at index 0...
        row("other", "unrelated"), // ...before "other" at index 1
      ]);
    });
  });

  describe("REGRESSION (review finding 3) — an `add` colliding with a rowId the baseline already has must reclassify to `updates`, not duplicate-create", () => {
    it("the exact executed sequence: add() while baseline is still loading (undefined, per the BASELINE COMPLETENESS CONTRACT), then a later edit once baseline has resolved — coalesceOntoAdd never revisits baseline, so the log entry stays `op: add` even though the row already exists server-side; resolveChanges must still route it to `updates`", () => {
      // Reproduces the reviewer's exact scenario for a singleton type
      // (`encounter`): a clinician starts filling the singleton while its
      // baseline query is still in flight (Task 7 is required to pass
      // `undefined`, never `[]`, during that window), so the FIRST edit
      // for SINGLETON_ROW_ID is recorded as `add`. `coalesceOntoAdd`
      // (editLog.ts:120-134) is the one coalescing arm that never consults
      // `baseline` at all — unlike the `update`/`remove` arms — so once
      // the baseline query resolves and a later edit lands for the SAME
      // rowId, the entry is still `op: "add"`, forever, even though the
      // server already has this row.
      const draftedWhileLoading = row(SINGLETON_ROW_ID, "drafted offline");
      const afterAdd = applyEditToLog(
        [],
        add(SINGLETON_ROW_ID, draftedWhileLoading),
      ); // no baseline option at all — the mandated "still loading" shape

      const baseline = baselineOf([
        [SINGLETON_ROW_ID, row(SINGLETON_ROW_ID, "server already has this")],
      ]);
      const editedAfterBaselineResolved = row(
        SINGLETON_ROW_ID,
        "drafted offline, then edited",
      );
      const log = applyEditToLog(
        afterAdd,
        update(SINGLETON_ROW_ID, editedAfterBaselineResolved),
        { baseline },
      );

      // Sanity check: the reducer really did leave this entry as `add`,
      // colliding with a rowId `baseline` now has — the false-invariant
      // shape this fix closes.
      assert.deepEqual(log, [
        add(SINGLETON_ROW_ID, editedAfterBaselineResolved),
      ]);

      const result = resolveChanges(log, { baseline });

      // NOT a duplicate create — reclassified to updates, carrying the
      // add's patch verbatim (see ResolvedChanges.updates' doc comment on
      // why that is safe specifically for a URL-keyed singleton endpoint).
      assert.deepEqual(result.creates, []);
      assert.deepEqual(result.updates, [editedAfterBaselineResolved]);
      assert.deepEqual(result.removes, []);
    });
  });

  it("COMBINED: last-write-wins, the orphan-drop rule, and the op switch all interact correctly in one log — orphan status is decided by the RESOLVED (last-write) op, not the rowId's first-seen op", () => {
    // "resurrected": first seen as a `remove`, later re-added as an
    // `update` — baseline HAS this rowId, so the resolved `update` is not
    // an orphan and lands in `updates` with the LAST patch.
    // "ghost": first seen as an `add` (which the orphan check always
    // exempts), later superseded by a `remove` — baseline LACKS this
    // rowId. If orphan status were (incorrectly) decided from the first
    // entry's op ("add"), this would wrongly bypass the check and emit a
    // bare-rowId remove for a row that was never on the server. Deciding
    // it from the RESOLVED op ("remove") correctly drops it instead.
    const baseline = baselineOf([
      ["resurrected", row("resurrected", "server-existing")],
    ]);
    const log: EditLog<TestRow> = [
      remove("resurrected", row("resurrected", "removed-first")),
      add("ghost", row("ghost", "added-first")),
      update("resurrected", row("resurrected", "restored-then-edited")),
      remove("ghost", row("ghost", "removed-after")),
    ];

    const result = resolveChanges(log, { baseline });

    assert.deepEqual(result.updates, [
      row("resurrected", "restored-then-edited"),
    ]);
    assert.deepEqual(result.removes, []); // "ghost" dropped as an orphan
    assert.deepEqual(result.creates, []);
  });

  it("an edit with an unrecognized op is silently dropped from every set — not reachable via a validated draft (isStructuredEditRecord already rejects an unknown op string), but documented and pinned regardless", () => {
    const bogus = {
      rowId: "x",
      op: "archive",
      patch: row("x", "bogus"),
    } as unknown as RowEdit<TestRow>;
    const log: EditLog<TestRow> = [bogus];

    const result = resolveChanges(log, {});

    assert.deepEqual(result, { creates: [], updates: [], removes: [] });
  });

  it("purity — the log/edits and the softDelete descriptor's patch are never mutated; the soft-delete body is a fresh object, not an alias of either source", () => {
    const lastKnown = Object.freeze(
      makeSymptomRow({ id: "s1", verification_status: "confirmed" }),
    );
    const softDeletePatch = Object.freeze({
      verification_status: "entered_in_error" as const,
    });
    const editEntry = Object.freeze(remove("s1", lastKnown));
    const log = Object.freeze([editEntry]);
    const softDelete: SoftDeleteDescriptor<SymptomRequest> = {
      patch: softDeletePatch,
      isDeleted: (r) => r.verification_status === "entered_in_error",
    };
    const logSnapshot = structuredClone(log);

    // Would throw synchronously in strict-mode ESM if resolveChanges tried
    // to mutate a frozen object/array anywhere along the way.
    const result = resolveChanges(log, { softDelete });

    assert.notEqual(result.removes[0].row, lastKnown);
    assert.notEqual(result.removes[0].row, softDeletePatch);
    assert.deepEqual(log, logSnapshot);
  });

  it("creates/updates alias the log's own patch object by reference — no cloning", () => {
    const addPatch = row("new-1", "fresh");
    const updatePatch = row("r1", "changed");
    const log: EditLog<TestRow> = [
      add("new-1", addPatch),
      update("r1", updatePatch),
    ];

    const result = resolveChanges(log, {});

    assert.equal(result.creates[0], addPatch);
    assert.equal(result.updates[0], updatePatch);
  });

  it("does not mutate the input log with a mixed op sequence — returns fresh arrays for every set", () => {
    const original: EditLog<TestRow> = [
      add("a1", row("a1", "x")),
      update("u1", row("u1", "y")),
      remove("r1", row("r1", "z")),
    ];
    Object.freeze(original);
    const snapshot = structuredClone(original);

    const result = resolveChanges(original, {});

    assert.deepEqual(original, snapshot);
    assert.equal(result.creates.length, 1);
    assert.equal(result.updates.length, 1);
    assert.equal(result.removes.length, 1);
  });
});
