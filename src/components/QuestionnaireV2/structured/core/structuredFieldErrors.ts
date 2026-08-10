import type { QuestionValidationError } from "@/types/questionnaire/batch";

import type { RowId } from "./types";

export interface StructuredFieldErrorMatch {
  questionId: string;
  /** Row identity. Omit for a section-level field — the encounter type's
   *  `hospitalization.discharge_disposition` has no row. */
  rowId?: RowId;
  fieldKeys: readonly string[];
}

/**
 * The ONE matcher. Exported separately from the component so
 * `StructuredList` can compute a cell's invalid ring and
 * `aria-describedby` without rendering anything, and so a type module
 * that owns its own error display uses identical semantics.
 *
 * Row identity: an error carrying `row_id` must equal `match.rowId`; an
 * error carrying neither binds ONLY to a section-level slot, i.e. one
 * with no row identity of its own. That second rule, in both directions,
 * is what stops a section-level slot from swallowing row errors and vice
 * versa.
 */
export function selectStructuredFieldErrors(
  errors: readonly QuestionValidationError[],
  { questionId, rowId, fieldKeys }: StructuredFieldErrorMatch,
): QuestionValidationError[] {
  return errors.filter((error) => {
    if (error.question_id !== questionId) return false;
    // Falsy, not `=== undefined` — aligned with `QuestionBlock.tsx`'s own
    // "does this error have a field key" check: an error with
    // `field_key: ""` must read as section-level at BOTH sites, or it
    // disappears entirely (kept out of the block list yet matching no
    // real field key here).
    if (!error.field_key) return false;
    if (!fieldKeys.includes(error.field_key)) return false;
    if (error.row_id !== undefined) return error.row_id === rowId;
    return rowId === undefined;
  });
}
