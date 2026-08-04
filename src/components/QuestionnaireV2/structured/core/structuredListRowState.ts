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

/** Every `field_key` some column already claims (`errorFieldKeys`,
 *  defaulting to `[column.key]`) — the set a fallback slot must NOT
 *  duplicate. */
function knownFieldKeys(columns: readonly ErrorProneColumn[]): Set<string> {
  return new Set(
    columns.flatMap((column) => column.errorFieldKeys ?? [column.key]),
  );
}

/**
 * Distinct `field_key`s, bound to THIS row, that belong to no declared
 * column.
 *
 * REVIEW FIX (Task 6, Important — the Task-4 Critical class recurring one
 * validator key away). A row-scoped error whose `field_key` no column owns
 * used to render NOWHERE: every per-cell check is keyed on
 * `column.errorFieldKeys ?? [column.key]`, so an error for, say, `"note"`
 * on a type with no `note` column (allergy/symptom/diagnosis's shared note
 * field lives at `placement: "row"`, which Phase 2 has no column for) had
 * no home. With `QuestionBlock`'s allow-list now suppressing the same
 * `field_key`-bearing error from the block-level list for every allow-
 * listed type (so it doesn't double-print), the result was total: message
 * deleted from the page, `role="alert"` never rendered, and — since
 * `rowHasBoundError` (below) didn't know about it either — the row stayed
 * collapsible on top of that, reproducing Critical 1 for the one class of
 * error this shell couldn't see.
 *
 * Reuses `selectStructuredFieldErrors` (the SAME matcher every per-cell
 * check and `StructuredFieldError` itself use) to CONFIRM each candidate
 * key is actually bound to this row/question — the candidate scan below
 * only narrows which keys to ask about, it never re-implements row-
 * identity matching itself, so this can't drift from the per-cell checks.
 */
export function unmatchedRowErrorFieldKeys(
  columns: readonly ErrorProneColumn[],
  errors: readonly QuestionValidationError[],
  match: { questionId: string; rowId: RowId; rowIndex: number },
): string[] {
  const known = knownFieldKeys(columns);
  const candidates = Array.from(
    new Set(
      errors
        .map((error) => error.field_key)
        .filter(
          (fieldKey): fieldKey is string =>
            fieldKey !== undefined && !known.has(fieldKey),
        ),
    ),
  );
  return candidates.filter(
    (fieldKey) =>
      selectStructuredFieldErrors(errors, {
        questionId: match.questionId,
        rowId: match.rowId,
        rowIndex: match.rowIndex,
        fieldKeys: [fieldKey],
      }).length > 0,
  );
}

/**
 * Does ANY column in this row carry a bound validation error — OR does an
 * error bind to this row under a `field_key` no column declares? Aggregates
 * across every column's `errorFieldKeys` (defaulting to `[column.key]`),
 * through the SAME matcher `StructuredFieldError` renders from — so "the
 * row has an error" and "some cell (or the fallback slot) renders one" can
 * never disagree with each other. The unmatched half is what makes an
 * undeclared `field_key` still force the row open (see
 * `unmatchedRowErrorFieldKeys`'s doc comment) instead of leaving Save
 * hard-blocked with no visible reason.
 */
export function rowHasBoundError(
  columns: readonly ErrorProneColumn[],
  errors: readonly QuestionValidationError[],
  match: { questionId: string; rowId: RowId; rowIndex: number },
): boolean {
  return (
    columns.some(
      (column) =>
        selectStructuredFieldErrors(errors, {
          questionId: match.questionId,
          rowId: match.rowId,
          rowIndex: match.rowIndex,
          fieldKeys: column.errorFieldKeys ?? [column.key],
        }).length > 0,
    ) || unmatchedRowErrorFieldKeys(columns, errors, match).length > 0
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
