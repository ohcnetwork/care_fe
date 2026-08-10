import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SymptomRequest } from "@/types/emr/symptom/symptom";

import { resolveChanges } from "./changes";
import { add, makeSymptomRow, remove, update } from "./testFixtures";
import type { EditLog, RowEdit, SoftDeleteDescriptor } from "./types";

/**
 * A small, deliberately generic row shape for the structural cases (op
 * routing, ordering, purity) — contrast `testFixtures.ts`'s
 * `makeSymptomRow`, used where the case is shape-sensitive (the
 * soft-delete marker field).
 */
interface TestRow {
  id: string;
  label: string;
}

function row(id: string, label: string): TestRow {
  return { id, label };
}

describe("resolveChanges — edit log resolved into create/update/remove sets", () => {
  it("an empty log resolves to three empty sets — a clinician who never touched the section sends zero requests for it", () => {
    const result = resolveChanges<TestRow>([], {});

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
