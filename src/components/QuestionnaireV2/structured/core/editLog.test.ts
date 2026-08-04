import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyEditToLog } from "./editLog";
import type { EditLog, RowEdit, RowId } from "./types";

/**
 * A small, deliberately generic row shape — this reducer is type-agnostic,
 * so the fixture is not modeled on any one clinical type (contrast
 * `deepEqual.test.ts`, which exercises real `SymptomRequest`/
 * `DiagnosisRequest` shapes because deep-equality edge cases are
 * shape-sensitive; coalescing is not).
 */
interface TestRow {
  id: string;
  note: string;
}

function row(id: string, note: string): TestRow {
  return { id, note };
}

function add(rowId: RowId, patch: TestRow): RowEdit<TestRow> {
  return { rowId, op: "add", patch };
}
function update(rowId: RowId, patch: TestRow): RowEdit<TestRow> {
  return { rowId, op: "update", patch };
}
function remove(rowId: RowId, patch: TestRow): RowEdit<TestRow> {
  return { rowId, op: "remove", patch };
}

function baselineOf(
  entries: ReadonlyArray<readonly [RowId, TestRow]>,
): ReadonlyMap<RowId, TestRow> {
  return new Map(entries);
}

describe("applyEditToLog — one edit per rowId, coalescing rules", () => {
  it("an add followed by an update on the same row stays ONE add (the row was never on the server)", () => {
    const afterAdd = applyEditToLog([], add("r1", row("r1", "first")));
    const afterUpdate = applyEditToLog(
      afterAdd,
      update("r1", row("r1", "second")),
    );

    assert.deepEqual(afterUpdate, [add("r1", row("r1", "second"))]);
  });

  it("an add followed by a remove ANNIHILATES the entry (log returns to pristine)", () => {
    const afterAdd = applyEditToLog([], add("r1", row("r1", "first")));
    const afterRemove = applyEditToLog(
      afterAdd,
      remove("r1", row("r1", "first")),
    );

    assert.deepEqual(afterRemove, []);
  });

  it("a baseline row's update followed by a remove becomes ONE remove", () => {
    const baseline = baselineOf([["r1", row("r1", "baseline")]]);
    const afterUpdate = applyEditToLog([], update("r1", row("r1", "changed")), {
      baseline,
    });
    const afterRemove = applyEditToLog(
      afterUpdate,
      remove("r1", row("r1", "changed")),
      { baseline },
    );

    assert.deepEqual(afterRemove, [remove("r1", row("r1", "changed"))]);
  });

  it("a baseline row's update followed by another update keeps ONE update with the latest patch", () => {
    const baseline = baselineOf([["r1", row("r1", "baseline")]]);
    const afterFirst = applyEditToLog([], update("r1", row("r1", "mild")), {
      baseline,
    });
    const afterSecond = applyEditToLog(
      afterFirst,
      update("r1", row("r1", "moderate")),
      { baseline },
    );

    assert.deepEqual(afterSecond, [update("r1", row("r1", "moderate"))]);
  });

  it("an update whose patch deep-equals its baseline row DROPS the entry (edit-then-revert leaves the section pristine)", () => {
    const baselineRow = row("r1", "baseline");
    const baseline = baselineOf([["r1", baselineRow]]);

    const afterEdit = applyEditToLog([], update("r1", row("r1", "moderate")), {
      baseline,
    });
    assert.equal(afterEdit.length, 1);

    // Same content as baseline, reconstructed as a fresh object — proves
    // the comparison is structural (deepEqualJson), not by reference.
    const revertPatch: TestRow = { id: "r1", note: "baseline" };
    const afterRevert = applyEditToLog(afterEdit, update("r1", revertPatch), {
      baseline,
    });

    assert.deepEqual(afterRevert, []);
  });

  it("a remove followed by an add on the same rowId is a legal resurrection: ONE update", () => {
    const afterRemove = applyEditToLog([], remove("r1", row("r1", "gone")));
    const afterAdd = applyEditToLog(
      afterRemove,
      add("r1", row("r1", "restored")),
    );

    assert.deepEqual(afterAdd, [update("r1", row("r1", "restored"))]);
  });

  it("edits on different rowIds never interact", () => {
    const afterR1 = applyEditToLog([], update("r1", row("r1", "one")));
    const afterR2 = applyEditToLog(afterR1, add("r2", row("r2", "two")));

    assert.deepEqual(afterR2, [
      update("r1", row("r1", "one")),
      add("r2", row("r2", "two")),
    ]);
    // The untouched r1 entry survives unchanged, not just deep-equal —
    // reinforces that only the targeted rowId's slot is touched.
    assert.equal(afterR2[0], afterR1[0]);
  });

  it("does not mutate the input log — returns a new array", () => {
    const original: EditLog<TestRow> = [add("r1", row("r1", "first"))];
    Object.freeze(original);

    const result = applyEditToLog(original, update("r1", row("r1", "second")));

    assert.notEqual(result, original);
    // The frozen input is provably untouched: still length 1, still the
    // original patch. (Object.freeze would throw synchronously on an
    // attempted in-place mutation, so reaching this line without throwing
    // already proves no mutation was attempted; the assertions confirm
    // the content too.)
    assert.deepEqual(original, [add("r1", row("r1", "first"))]);
  });

  it("does not mutate the input log even when an entry is annihilated", () => {
    const original: EditLog<TestRow> = [add("r1", row("r1", "first"))];
    Object.freeze(original);

    const result = applyEditToLog(original, remove("r1", row("r1", "first")));

    assert.notEqual(result, original);
    assert.deepEqual(result, []);
    assert.equal(original.length, 1);
  });

  it("a remove followed by another remove keeps the log idempotent", () => {
    const afterFirst = applyEditToLog([], remove("r1", row("r1", "gone")));
    const afterSecond = applyEditToLog(
      afterFirst,
      remove("r1", row("r1", "gone again")),
    );

    assert.deepEqual(afterSecond, [remove("r1", row("r1", "gone"))]);
  });

  it("an update on a row with no baseline entry can never revert — it is kept even if options.baseline is entirely absent", () => {
    const afterFirst = applyEditToLog([], update("r1", row("r1", "value")));
    // No baseline supplied at all — there is nothing to compare against,
    // so a repeated identical update must not be treated as a revert.
    const afterSecond = applyEditToLog(
      afterFirst,
      update("r1", row("r1", "value")),
    );

    assert.deepEqual(afterSecond, [update("r1", row("r1", "value"))]);
  });

  it("preserves position on coalesce — only genuinely new rowIds append to the end", () => {
    const baseline = baselineOf([["r2", row("r2", "baseline-2")]]);
    const step1 = applyEditToLog([], add("r1", row("r1", "1")));
    const step2 = applyEditToLog(step1, update("r2", row("r2", "2")), {
      baseline,
    });
    const step3 = applyEditToLog(step2, add("r3", row("r3", "3")));

    // Update the middle entry again — its position must not move to the
    // end just because it was touched a second time.
    const step4 = applyEditToLog(step3, update("r2", row("r2", "2-edited")), {
      baseline,
    });

    assert.deepEqual(
      step4.map((entry) => entry.rowId),
      ["r1", "r2", "r3"],
    );
    assert.deepEqual(step4[1], update("r2", row("r2", "2-edited")));
  });
});
