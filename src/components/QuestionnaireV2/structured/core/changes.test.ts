import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SymptomRequest } from "@/types/emr/symptom/symptom";

import { resolveChanges } from "./changes";
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

  it("JUDGMENT CALL: a remove for a rowId that never touched the server still lands in removes — resolveChanges has no baseline to re-derive server existence from, so it trusts the log's op", () => {
    // In production `editLog.ts` annihilates an add-then-remove pair before
    // it ever reaches a well-formed log (`editLog.test.ts`'s "ANNIHILATES"
    // case) — a genuinely client-only row's remove never survives to reach
    // this function via the real reducer. Unlike `projectRows` (which
    // receives a `baseline` array and so CAN and does drop this shape),
    // `resolveChanges`'s signature carries no baseline map at all: it has
    // no way to tell "never existed server-side" apart from "existed and
    // was removed," and does not pretend to. Every `remove` op the log
    // hands it is reported, unconditionally — trusting the invariant the
    // reducer already guarantees, rather than re-deriving it here with
    // information this layer was deliberately not given.
    const log: EditLog<TestRow> = [
      remove("client-only-uuid", row("client-only-uuid", "never existed")),
    ];

    const result = resolveChanges(log, {});

    assert.deepEqual(result.removes, [{ rowId: "client-only-uuid" }]);
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
