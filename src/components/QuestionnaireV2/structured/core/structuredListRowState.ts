import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { selectStructuredFieldErrors } from "./structuredFieldErrors";
import type { RowId } from "./types";

/** The column shape {@link resolveRowErrorState} needs — a structural subset
 *  of `StructuredColumn<TRow>` so this stays free of the primitive's generic
 *  `TRow` parameter and is trivially unit-testable (no React, no `.tsx`). */
export interface ErrorProneColumn {
  key: string;
  errorFieldKeys?: readonly string[];
  mobileHidden?: boolean;
}

/** Which row, in which question, errors must bind to. */
export interface RowErrorMatch {
  questionId: string;
  rowId: RowId;
}

/** Does any error bind to this column's cell in this row? The same matcher
 *  the cell's own `StructuredFieldError` renders from. */
function columnHasBoundError(
  column: ErrorProneColumn,
  errors: readonly QuestionValidationError[],
  match: RowErrorMatch,
): boolean {
  return (
    selectStructuredFieldErrors(errors, {
      questionId: match.questionId,
      rowId: match.rowId,
      fieldKeys: column.errorFieldKeys ?? [column.key],
    }).length > 0
  );
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
 * fallback slot can render them and {@link resolveRowErrorState}'s
 * `hasError` can force the row open.
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
  match: RowErrorMatch,
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
        fieldKeys: [fieldKey],
      }).length > 0,
  );
}

/** Everything one row's chrome needs to know about the errors bound to it,
 *  resolved in a single pass — the row force-expands, prints the keys no
 *  column owns, AND re-prints the ones whose cell is invisible below `lg`,
 *  all from one scan and one shared matcher, so the three can never
 *  disagree with each other. */
export interface RowErrorState<TColumn extends ErrorProneColumn> {
  /** Any error binds to this row at all — through a column's cell or under
   *  a `field_key` no column declares. Forces the row open below `lg`. */
  hasError: boolean;
  /** Distinct `field_key`s bound to this row that belong to no declared
   *  column — see {@link unmatchedRowErrorFieldKeys}. */
  unmatchedFieldKeys: string[];
  /** Columns carrying an error whose cell is `display:none` below `lg`.
   *  Their message renders inside that hidden cell, so at narrow widths the
   *  row would pin itself open, disable its own collapse toggle and block
   *  Save while showing nothing — the caller re-renders these in a slot
   *  that is visible there. */
  mobileHiddenErrorColumns: TColumn[];
}

export function resolveRowErrorState<TColumn extends ErrorProneColumn>(
  columns: readonly TColumn[],
  errors: readonly QuestionValidationError[],
  match: RowErrorMatch,
): RowErrorState<TColumn> {
  const columnsWithError = columns.filter((column) =>
    columnHasBoundError(column, errors, match),
  );
  const unmatchedFieldKeys = unmatchedRowErrorFieldKeys(columns, errors, match);
  return {
    hasError: columnsWithError.length > 0 || unmatchedFieldKeys.length > 0,
    unmatchedFieldKeys,
    mobileHiddenErrorColumns: columnsWithError.filter(
      (column) => column.mobileHidden,
    ),
  };
}
