import type { QuestionValidationError } from "@/types/questionnaire/batch";

import type { RowId } from "./types";

export interface StructuredFieldErrorMatch {
  questionId: string;
  /** v2 identity. Omit for a section-level field — the encounter type's
   *  `hospitalization.discharge_disposition` has no row. */
  rowId?: RowId;
  /** v1/server identity fallback: the row's CURRENT position in the
   *  projection. Server batch errors and v1 validators are index-keyed. */
  rowIndex?: number;
  fieldKeys: readonly string[];
}

/**
 * The ONE matcher. Exported separately from the component so
 * `StructuredList` can compute a cell's invalid ring and `aria-describedby`
 * without rendering anything, and so a type module that owns its own error
 * display uses identical semantics. Replaces all three legacy mechanisms:
 * `QuestionTypes/FieldError.tsx` (index-keyed, message), the
 * `useFieldError` ring (`types/questionnaire/validation.ts:25-49`, no
 * message at all), and "nothing".
 *
 * Row identity, in precedence order — the dual-contract shim's error half:
 *  1. the error carries `row_id`  → it must equal `match.rowId`;
 *  2. else it carries `index`     → it must equal `match.rowIndex`;
 *  3. else (neither)              → it binds ONLY to a section-level slot,
 *     i.e. one with no row identity of its own.
 * Rule 3 in both directions is what stops a section-level slot from
 * swallowing row errors and vice versa. The `index` clause and `rowIndex`
 * go with the shim in Phase 5.
 */
export function selectStructuredFieldErrors(
  errors: readonly QuestionValidationError[],
  { questionId, rowId, rowIndex, fieldKeys }: StructuredFieldErrorMatch,
): QuestionValidationError[] {
  return errors.filter((error) => {
    if (error.question_id !== questionId) return false;
    // Falsy, not `=== undefined` — aligned with `QuestionBlock.tsx`'s own
    // "does this error have a field key" check (REVIEW FIX, minor): an
    // error with `field_key: ""` must read as section-level to BOTH sites,
    // or it would vanish from the block list (which keeps only fieldless
    // errors) without ever matching here either (`""` binds no real field
    // key), disappearing entirely instead of merely being section-level.
    if (!error.field_key) return false;
    if (!fieldKeys.includes(error.field_key)) return false;
    if (error.row_id !== undefined) return error.row_id === rowId;
    if (error.index !== undefined)
      return rowIndex !== undefined && error.index === rowIndex;
    return rowId === undefined && rowIndex === undefined;
  });
}
