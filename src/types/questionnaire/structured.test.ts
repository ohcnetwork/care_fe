import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isStructuredEditRecord } from "./structured";

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
