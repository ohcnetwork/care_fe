import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestionValidationError } from "@/types/questionnaire/batch";

import {
  resolveRowErrorState,
  unmatchedRowErrorFieldKeys,
  type ErrorProneColumn,
} from "./structuredListRowState";

const err = (
  over: Partial<QuestionValidationError> = {},
): QuestionValidationError => ({
  question_id: "q-1",
  field_key: "quantity",
  error: "bad",
  ...over,
});

/** `resolveRowErrorState(...).hasError` — the forced-expansion decision,
 *  the half of the resolver these cases are about. */
const rowHasBoundError = (
  columns: readonly ErrorProneColumn[],
  errors: readonly QuestionValidationError[],
  match: { questionId: string; rowId: string; rowIndex: number },
): boolean => resolveRowErrorState(columns, errors, match).hasError;

describe("resolveRowErrorState — hasError", () => {
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

  it("an UNMATCHED field_key (no column owns it) still counts as a bound error", () => {
    // Reproduces allergy/symptom/diagnosis's shared `note` field: it lives
    // at `placement: "row"`, which has no column of its own.
    assert.equal(
      rowHasBoundError(
        [{ key: "quantity" }],
        [err({ row_id: "row-1", field_key: "note" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      true,
    );
  });
});

describe("unmatchedRowErrorFieldKeys", () => {
  it("no errors => []", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys([{ key: "quantity" }], [], {
        questionId: "q-1",
        rowId: "row-1",
        rowIndex: 0,
      }),
      [],
    );
  });

  it("an error whose field_key a column already owns is NOT unmatched", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "quantity" }],
        [err({ row_id: "row-1", field_key: "quantity" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      [],
    );
  });

  it("an error whose field_key NO column owns, bound to this row, IS unmatched", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "quantity" }],
        [err({ row_id: "row-1", field_key: "note" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      ["note"],
    );
  });

  it("an unmatched field_key bound to a DIFFERENT row is excluded", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "quantity" }],
        [err({ row_id: "row-2", field_key: "note" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      [],
    );
  });

  it("an unmatched field_key for a DIFFERENT question is excluded", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "quantity" }],
        [err({ row_id: "row-1", field_key: "note", question_id: "q-2" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      [],
    );
  });

  it("multiple distinct unmatched keys are all returned, deduplicated", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "quantity" }],
        [
          err({ row_id: "row-1", field_key: "note" }),
          err({ row_id: "row-1", field_key: "note" }),
          err({ row_id: "row-1", field_key: "reason" }),
        ],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ).sort(),
      ["note", "reason"],
    );
  });

  it("respects a column's errorFieldKeys override — a sub-key it owns is NOT unmatched", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "dosage", errorFieldKeys: ["dose_0", "dose_1"] }],
        [err({ row_id: "row-1", field_key: "dose_1" })],
        { questionId: "q-1", rowId: "row-1", rowIndex: 0 },
      ),
      [],
    );
  });

  it("a v1-shim index-only unmatched error still matches by rowIndex", () => {
    assert.deepEqual(
      unmatchedRowErrorFieldKeys(
        [{ key: "quantity" }],
        [err({ row_id: undefined, index: 2, field_key: "note" })],
        { questionId: "q-1", rowId: "row-3", rowIndex: 2 },
      ),
      ["note"],
    );
  });
});

describe("resolveRowErrorState — mobileHiddenErrorColumns", () => {
  const match = { questionId: "q-1", rowId: "row-1", rowIndex: 0 };

  it("a column with no errors is never listed, mobileHidden or not", () => {
    assert.deepEqual(
      resolveRowErrorState(
        [{ key: "quantity", mobileHidden: true }, { key: "item" }],
        [],
        match,
      ).mobileHiddenErrorColumns,
      [],
    );
  });

  it("an erroring VISIBLE column is not listed — its own cell renders the message at every width", () => {
    assert.deepEqual(
      resolveRowErrorState(
        [{ key: "quantity" }],
        [err({ row_id: "row-1" })],
        match,
      ).mobileHiddenErrorColumns,
      [],
    );
  });

  it("an erroring mobileHidden column is listed, and still counts towards hasError", () => {
    const column: ErrorProneColumn = { key: "quantity", mobileHidden: true };
    const state = resolveRowErrorState(
      [column],
      [err({ row_id: "row-1" })],
      match,
    );
    assert.deepEqual(state.mobileHiddenErrorColumns, [column]);
    assert.equal(state.hasError, true);
  });

  it("respects errorFieldKeys — a mobileHidden column erroring on a sub-key it owns is listed", () => {
    const column: ErrorProneColumn = {
      key: "dosage",
      errorFieldKeys: ["dose_0", "dose_1"],
      mobileHidden: true,
    };
    assert.deepEqual(
      resolveRowErrorState(
        [column],
        [err({ row_id: "row-1", field_key: "dose_1" })],
        match,
      ).mobileHiddenErrorColumns,
      [column],
    );
  });

  it("an error bound to a DIFFERENT row does not list the column", () => {
    assert.deepEqual(
      resolveRowErrorState(
        [{ key: "quantity", mobileHidden: true }],
        [err({ row_id: "row-2" })],
        match,
      ).mobileHiddenErrorColumns,
      [],
    );
  });
});
