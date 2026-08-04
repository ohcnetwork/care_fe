import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { resolveRowExpanded, rowHasBoundError } from "./structuredListRowState";

const err = (
  over: Partial<QuestionValidationError> = {},
): QuestionValidationError => ({
  question_id: "q-1",
  field_key: "quantity",
  error: "bad",
  ...over,
});

describe("rowHasBoundError", () => {
  it("no columns => false", () => {
    assert.equal(
      rowHasBoundError([], [], {
        questionId: "q-1",
        rowId: "row-1",
        rowIndex: 0,
      }),
      false,
    );
  });

  it("a column with no errors at all => false", () => {
    assert.equal(
      rowHasBoundError([{ key: "quantity" }], [], {
        questionId: "q-1",
        rowId: "row-1",
        rowIndex: 0,
      }),
      false,
    );
  });

  it("a matching error on the row's own column => true", () => {
    assert.equal(
      rowHasBoundError([{ key: "quantity" }], [err({ row_id: "row-1" })], {
        questionId: "q-1",
        rowId: "row-1",
        rowIndex: 0,
      }),
      true,
    );
  });

  it("an error bound to a DIFFERENT row => false", () => {
    assert.equal(
      rowHasBoundError([{ key: "quantity" }], [err({ row_id: "row-2" })], {
        questionId: "q-1",
        rowId: "row-1",
        rowIndex: 0,
      }),
      false,
    );
  });

  it("an error bound to a DIFFERENT question => false", () => {
    assert.equal(
      rowHasBoundError(
        [{ key: "quantity" }],
        [err({ row_id: "row-1", question_id: "q-2" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      false,
    );
  });

  it("checks EVERY column, not just the first", () => {
    assert.equal(
      rowHasBoundError(
        [{ key: "item" }, { key: "quantity" }, { key: "performer" }],
        [err({ row_id: "row-1", field_key: "performer" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      true,
    );
  });

  it("respects a column's errorFieldKeys override", () => {
    assert.equal(
      rowHasBoundError(
        [{ key: "dosage", errorFieldKeys: ["dose_0", "dose_1"] }],
        [err({ row_id: "row-1", field_key: "dose_1" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      true,
    );
  });

  it("a v1-shim index-only error still matches by rowIndex", () => {
    assert.equal(
      rowHasBoundError(
        [{ key: "quantity" }],
        [err({ row_id: undefined, index: 2 })],
        { questionId: "q-1", rowId: "row-3", rowIndex: 2 },
      ),
      true,
    );
  });
});

describe("resolveRowExpanded", () => {
  it("collapsed, no error => stays collapsed", () => {
    assert.equal(resolveRowExpanded(false, false), false);
  });

  it("collapsed, has error => forced open", () => {
    assert.equal(resolveRowExpanded(false, true), true);
  });

  it("expanded, no error => stays expanded", () => {
    assert.equal(resolveRowExpanded(true, false), true);
  });

  it("expanded, has error => stays expanded", () => {
    assert.equal(resolveRowExpanded(true, true), true);
  });
});
