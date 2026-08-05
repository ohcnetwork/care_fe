import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isStructuredEditRecord,
  sanitizeStructuredEditLog,
} from "./structured";

describe("isStructuredEditRecord", () => {
  it("accepts each well-formed op", () => {
    for (const op of ["add", "update", "remove"]) {
      assert.equal(
        isStructuredEditRecord({ rowId: "r1", op, patch: {} }),
        true,
      );
    }
  });

  it("accepts a remove with no patch", () => {
    assert.equal(isStructuredEditRecord({ rowId: "r1", op: "remove" }), true);
  });

  it("rejects malformed drafts", () => {
    // A hand-edited localStorage entry or a dump from an older build.
    assert.equal(isStructuredEditRecord(null), false);
    assert.equal(isStructuredEditRecord(undefined), false);
    assert.equal(isStructuredEditRecord("add"), false);
    assert.equal(isStructuredEditRecord({ op: "add" }), false);
    assert.equal(isStructuredEditRecord({ rowId: "", op: "add" }), false);
    assert.equal(isStructuredEditRecord({ rowId: "r1", op: "delete" }), false);
    assert.equal(isStructuredEditRecord({ rowId: 1, op: "add" }), false);
  });
});

describe("sanitizeStructuredEditLog", () => {
  it("passes a well-formed log through unchanged in content", () => {
    const log = [
      { rowId: "a", op: "add", patch: { n: 1 } },
      { rowId: "b", op: "update", patch: { n: 2 } },
    ];
    assert.deepEqual(sanitizeStructuredEditLog(log), log);
  });

  it("drops malformed entries (isStructuredEditRecord false)", () => {
    const log = [
      { rowId: "a", op: "add", patch: {} },
      { rowId: "", op: "add" }, // empty rowId
      { rowId: "b", op: "delete" }, // unknown op
      null,
      "garbage",
      { op: "add" }, // no rowId at all
    ];
    assert.deepEqual(sanitizeStructuredEditLog(log), [
      { rowId: "a", op: "add", patch: {} },
    ]);
  });

  it("non-array input sanitizes to an empty log", () => {
    assert.deepEqual(sanitizeStructuredEditLog(undefined), []);
    assert.deepEqual(sanitizeStructuredEditLog(null), []);
    assert.deepEqual(sanitizeStructuredEditLog("not an array"), []);
    assert.deepEqual(sanitizeStructuredEditLog({ rowId: "a" }), []);
  });

  it("a duplicate rowId collapses to one entry — last content, first position", () => {
    // This malformed shape exercises projectRows/resolveChanges agreement:
    // rowId "a" appears twice, "b" once, in between.
    const aFirst = { rowId: "a", op: "add", patch: { note: "a-first" } };
    const bOnly = { rowId: "b", op: "add", patch: { note: "b-only" } };
    const aLast = { rowId: "a", op: "add", patch: { note: "a-last" } };

    const sanitized = sanitizeStructuredEditLog([aFirst, bOnly, aLast]);

    // Exactly one entry per rowId.
    assert.equal(sanitized.length, 2);
    // Content is the LAST write for "a" ...
    assert.deepEqual(sanitized[0], {
      rowId: "a",
      op: "add",
      patch: { note: "a-last" },
    });
    // ... but its POSITION is the FIRST occurrence — ahead of "b", matching
    // resolveChanges' dispatch-at-first-occurrence order, so a
    // caller feeding this sanitized log to projectRows/resolveChanges gets
    // the SAME row in both places.
    assert.deepEqual(sanitized[1], bOnly);
  });

  it("a duplicate rowId with differing ops resolves op AND content from the last entry", () => {
    const log = [
      { rowId: "a", op: "add", patch: { note: "created" } },
      { rowId: "a", op: "update", patch: { note: "edited" } },
    ];
    assert.deepEqual(sanitizeStructuredEditLog(log), [
      { rowId: "a", op: "update", patch: { note: "edited" } },
    ]);
  });

  it("a malformed duplicate (one well-formed, one garbage entry for the same rowId) keeps only the well-formed one", () => {
    const log = [
      { rowId: "a", op: "add", patch: { note: "real" } },
      { rowId: "a", op: "bogus" }, // invalid op — dropped by isStructuredEditRecord
    ];
    assert.deepEqual(sanitizeStructuredEditLog(log), [
      { rowId: "a", op: "add", patch: { note: "real" } },
    ]);
  });
});
