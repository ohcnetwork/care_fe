import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseStructuredReferenceId, structuredReferenceId } from "./types";

describe("structured reference ids", () => {
  it("round-trips a question outside repeats", () => {
    const id = structuredReferenceId("symptom", "q-1");
    assert.equal(id, "structured:symptom:q-1");
    assert.deepEqual(parseStructuredReferenceId(id), {
      type: "symptom",
      questionId: "q-1",
      rowIndexes: [],
    });
  });

  it("keeps rows of a repeated question distinct", () => {
    const path = [
      { questionId: "outer", rowIndex: 0 },
      { questionId: "inner", rowIndex: 2 },
    ];
    const id = structuredReferenceId("time_of_death", "q:1", path);
    assert.equal(id, "structured:time_of_death:q:1#r0.r2");
    assert.notEqual(
      id,
      structuredReferenceId("time_of_death", "q:1", [
        { questionId: "outer", rowIndex: 1 },
      ]),
    );
    assert.deepEqual(parseStructuredReferenceId(id), {
      type: "time_of_death",
      questionId: "q:1",
      rowIndexes: [0, 2],
    });
    assert.equal(
      structuredReferenceId("symptom", "q", []),
      "structured:symptom:q",
    );
  });

  it("rejects ids it did not produce", () => {
    for (const id of [
      "symptom:q",
      "structured:symptom",
      "structured:symptom:",
      "structured:symptom:q#x1",
      "structured:symptom:q#r0#r1",
    ]) {
      assert.equal(parseStructuredReferenceId(id), undefined, id);
    }
  });
});
