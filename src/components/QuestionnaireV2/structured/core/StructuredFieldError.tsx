import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { selectStructuredFieldErrors } from "./structuredFieldErrors";
import type { RowId } from "./types";

export interface StructuredFieldErrorProps {
  /** DOM id, so the control can point `aria-describedby` here. */
  id?: string;
  questionId: string;
  rowId?: RowId;
  fieldKeys: readonly string[];
  errors: readonly QuestionValidationError[];
  className?: string;
}

/**
 * The single structured field error display — see
 * `selectStructuredFieldErrors` for the matching rules. Renders beside its
 * control, inside the same cell/section, so `aria-describedby` and the
 * visual proximity agree.
 */
export function StructuredFieldError({
  id,
  questionId,
  rowId,
  fieldKeys,
  errors,
  className,
}: StructuredFieldErrorProps) {
  const { t } = useTranslation();
  const [error] = selectStructuredFieldErrors(errors, {
    questionId,
    rowId,
    fieldKeys,
  });
  if (!error) return null;
  return (
    // role="alert" is REQUIRED here: QuestionBlock.tsx's block-level error
    // list filters field-bound errors out for the structured types that
    // render this primitive, so this is the only place THEIR field-bound
    // errors are ever announced. Message resolution — `error.error`, then
    // `error.msg`, then the fallback, joined with `||` not `??` so an
    // empty-string message falls through — matches QuestionBlock's own
    // block-level list exactly. Only the FIRST binding error renders per
    // slot; the rest stay available through the matcher for the invalid
    // ring.
    <p
      id={id}
      role="alert"
      className={cn("mt-1 text-sm text-red-600", className)}
    >
      {error.error || error.msg || t("field_required")}
    </p>
  );
}
