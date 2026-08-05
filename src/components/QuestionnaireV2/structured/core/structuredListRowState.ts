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
 * A row-scoped error whose `field_key` no column owns would otherwise
 * render NOWHERE: per-cell checks key on `column.errorFieldKeys ??
 * [column.key]`, and `QuestionBlock`'s allow-list suppresses the same
 * error from the block-level list — message deleted from the page,
 * `role="alert"` never rendered, row still collapsible, Save
 * hard-blocked with no visible reason. This names those keys so a
 * fallback slot can render them and `rowHasBoundError` can force the row
 * open.
 *
 * Reuses `selectStructuredFieldErrors` (the same matcher every per-cell
 * check uses) to CONFIRM each candidate is actually bound to this
 * row/question — the candidate scan only narrows which keys to ask
 * about; it never re-implements row-identity matching, so this cannot
 * drift from the per-cell checks.
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
 * A row carrying a bound error must never be collapsible away below
 * `lg`: the mobile body wrapper is the ONLY place the error message
 * renders, so a collapsed row's `role="alert"` sits in a `display:none`
 * subtree and is never announced — a hard-blocked Save would leave every
 * row on screen looking clean. `hasError` wins over the clinician's own
 * toggle; the toggle regains control the instant the error clears.
 */
export function resolveRowExpanded(
  toggledExpanded: boolean,
  hasError: boolean,
): boolean {
  return toggledExpanded || hasError;
}
