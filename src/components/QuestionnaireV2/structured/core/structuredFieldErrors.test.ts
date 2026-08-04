import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { selectStructuredFieldErrors } from "./structuredFieldErrors";

const err = (
  over: Partial<QuestionValidationError> = {},
): QuestionValidationError => ({
  question_id: "q-1",
  field_key: "slot_id",
  error: "error",
  ...over,
});

describe("selectStructuredFieldErrors", () => {
  it("binds on question_id + field_key + row_id", () => {
    const error = err({ row_id: "row-1" });
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["slot_id"],
      }),
      [error],
    );
  });

  it("does NOT bind across question ids (two questions of the same type)", () => {
    const error = err({ question_id: "q-2", row_id: "row-1" });
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["slot_id"],
      }),
      [],
    );
  });

  it("does NOT bind across field_keys", () => {
    const error = err({ field_key: "note", row_id: "row-1" });
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["slot_id"],
      }),
      [],
    );
  });

  it("does NOT bind across row_ids", () => {
    const error = err({ row_id: "row-1" });
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-2",
        fieldKeys: ["slot_id"],
      }),
      [],
    );
  });

  it("v1 fallback: an error with `index` and no `row_id` binds by rowIndex", () => {
    const error = err({ index: 2 });
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowIndex: 2,
        fieldKeys: ["slot_id"],
      }),
      [error],
    );
  });

  it("an error carrying BOTH row_id and index prefers row_id (row_id wins, and does NOT also match a different rowId that shares the index)", () => {
    const error = err({ row_id: "row-1", index: 2 });
    // Matching the carried row_id succeeds even though rowIndex differs.
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        rowIndex: 99,
        fieldKeys: ["slot_id"],
      }),
      [error],
    );
    // A DIFFERENT row that happens to share the index must NOT match —
    // row_id's presence on the error stops the index fallback entirely.
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-2",
        rowIndex: 2,
        fieldKeys: ["slot_id"],
      }),
      [],
    );
  });

  it("an error with NEITHER binds only to a section-level slot (rowId === undefined && rowIndex === undefined)", () => {
    const error = err();
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        fieldKeys: ["slot_id"],
      }),
      [error],
    );
  });

  it("a section-level slot does NOT swallow a row-scoped error", () => {
    const error = err();
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["slot_id"],
      }),
      [],
    );
  });

  it("multiple field keys: a column owning sub-fields matches any of them", () => {
    const error = err({ field_key: "dose_quantity", row_id: "row-1" });
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["dose_quantity", "dose_unit"],
      }),
      [error],
    );
  });

  it("REVIEW FIX (minor): an empty-string field_key is treated the same as no field_key at all — never matches through this primitive, aligned with QuestionBlock.tsx's own falsy check", () => {
    const error = err({ field_key: "" });
    // Neither a section-level query (no rowId/rowIndex)...
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        fieldKeys: ["slot_id"],
      }),
      [],
    );
    // ...nor a row-scoped one matches: `""` is not a real field key. This
    // is what keeps the error from vanishing entirely — QuestionBlock.tsx's
    // `!error.field_key` filter treats it identically (falsy), so it stays
    // in the BLOCK-level list precisely because this primitive never
    // claims it.
    assert.deepEqual(
      selectStructuredFieldErrors([error], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["slot_id"],
      }),
      [],
    );
  });

  it("order is preserved (the first binding error is what renders)", () => {
    const first = err({ row_id: "row-1", error: "first" });
    const second = err({ row_id: "row-1", error: "second" });
    assert.deepEqual(
      selectStructuredFieldErrors([first, second], {
        questionId: "q-1",
        rowId: "row-1",
        fieldKeys: ["slot_id"],
      }),
      [first, second],
    );
  });
});
