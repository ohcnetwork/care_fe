import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findDuplicateCandidates } from "./duplicates";
import type { ProjectedRow } from "./types";

interface TestRow {
  id: string;
  code: string;
}

function projected(
  rowId: string,
  code: string,
  overrides: Partial<ProjectedRow<TestRow>> = {},
): ProjectedRow<TestRow> {
  return {
    rowId,
    row: { id: rowId, code },
    origin: "baseline",
    edited: false,
    softDeleted: false,
    ...overrides,
  };
}

const byCode = (row: TestRow) => row.code;

describe("findDuplicateCandidates — the add-time duplicate guard", () => {
  it("with no duplicateKey configured, nothing is ever flagged", () => {
    const rows = [projected("r1", "R05")];
    const result = findDuplicateCandidates(rows, undefined, [
      { id: "new", code: "R05" },
    ]);
    assert.deepEqual(result, [false]);
  });

  it("flags a candidate whose key already exists among the current (non-deleted) rows", () => {
    const rows = [projected("r1", "R05")];
    const result = findDuplicateCandidates(rows, byCode, [
      { id: "new", code: "R05" },
    ]);
    assert.deepEqual(result, [true]);
  });

  it("does not flag a candidate whose key is absent from the current rows", () => {
    const rows = [projected("r1", "R05")];
    const result = findDuplicateCandidates(rows, byCode, [
      { id: "new", code: "J45" },
    ]);
    assert.deepEqual(result, [false]);
  });

  it("skips softDeleted rows when building the existing-key set — re-adding an entered-in-error code is allowed", () => {
    const rows = [projected("r1", "R05", { softDeleted: true })];
    const result = findDuplicateCandidates(rows, byCode, [
      { id: "new", code: "R05" },
    ]);
    assert.deepEqual(result, [false]);
  });

  it("a duplicateKey returning undefined for a row never blocks anything and is never itself flagged", () => {
    const keyless = () => undefined;
    const rows = [projected("r1", "R05")];
    const result = findDuplicateCandidates(rows, keyless, [
      { id: "new", code: "R05" },
    ]);
    assert.deepEqual(result, [false]);
  });

  it("checks incrementally: two identical candidates in one batch — the first is accepted, the second is flagged", () => {
    const result = findDuplicateCandidates([], byCode, [
      { id: "a", code: "R05" },
      { id: "b", code: "R05" },
    ]);
    assert.deepEqual(result, [false, true]);
  });

  it("three candidates, only the middle one colliding with an existing row", () => {
    const rows = [projected("r1", "J45")];
    const result = findDuplicateCandidates(rows, byCode, [
      { id: "a", code: "R05" },
      { id: "b", code: "J45" },
      { id: "c", code: "M54" },
    ]);
    assert.deepEqual(result, [false, true, false]);
  });

  it("purity — neither rows nor candidates are mutated", () => {
    const rows = Object.freeze([Object.freeze(projected("r1", "R05"))]);
    const candidates = Object.freeze([
      Object.freeze({ id: "new", code: "R05" }),
    ]);

    const result = findDuplicateCandidates(rows, byCode, candidates);

    assert.deepEqual(result, [true]);
    assert.equal(rows.length, 1);
    assert.equal(candidates.length, 1);
  });
});
