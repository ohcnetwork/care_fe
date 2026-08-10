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

  it("an error with no row_id binds only to a section-level slot (rowId === undefined)", () => {
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

  it("an empty-string field_key is treated the same as no field_key at all — never matches through this primitive, aligned with QuestionBlock.tsx's own falsy check", () => {
    const error = err({ field_key: "" });
    // Neither a section-level query (no rowId)...
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
