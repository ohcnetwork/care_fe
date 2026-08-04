import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { selectStructuredFieldErrors } from "./structuredFieldErrors";
import type { RowId } from "./types";

/** The column shape {@link rowHasBoundError} needs — a structural subset of
 *  `StructuredColumn<TRow>` so this stays free of the primitive's generic
 *  `TRow` parameter and is trivially unit-testable (no React, no `.tsx`). */
export interface ErrorProneColumn {
  key: string;
  errorFieldKeys?: readonly string[];
}

/**
 * Does ANY column in this row carry a bound validation error? Aggregates
 * across every column's `errorFieldKeys` (defaulting to `[column.key]`),
 * through the SAME matcher `StructuredFieldError` renders from — so "the
 * row has an error" and "some cell renders one" can never disagree with
 * each other.
 */
export function rowHasBoundError(
  columns: readonly ErrorProneColumn[],
  errors: readonly QuestionValidationError[],
  match: { questionId: string; rowId: RowId; rowIndex: number },
): boolean {
  return columns.some(
    (column) =>
      selectStructuredFieldErrors(errors, {
        questionId: match.questionId,
        rowId: match.rowId,
        rowIndex: match.rowIndex,
        fieldKeys: column.errorFieldKeys ?? [column.key],
      }).length > 0,
  );
}

/**
 * A row carrying a bound error must never be collapsible away below `lg`
 * (Task 6 review, Critical 1): the mobile chrome's body wrapper is the
 * ONLY place that error's message renders — a collapsed row with an error
 * sits in a `display:none` subtree, so its `role="alert"` is never
 * announced, and a hard-blocked Save leaves every row on screen looking
 * clean. `hasError` always wins over the clinician's own collapse toggle;
 * it reverts to honoring the toggle's own state the instant the error
 * clears (e.g. the clinician fixes a DIFFERENT still-invalid row and this
 * one's error resolves as a side effect, or the row is removed and
 * re-added). Pure and separated from `resolveRowExpanded`'s caller so the
 * decision is unit-tested independent of React state.
 */
export function resolveRowExpanded(
  toggledExpanded: boolean,
  hasError: boolean,
): boolean {
  return toggledExpanded || hasError;
}
