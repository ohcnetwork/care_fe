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
  rowIndex?: number;
  fieldKeys: readonly string[];
  errors: readonly QuestionValidationError[];
  className?: string;
}

/**
 * ONE structured field error display, replacing three legacy mechanisms —
 * see `selectStructuredFieldErrors`' doc comment for the full list. Renders
 * beside its control, inside the same cell/section, so `aria-describedby`
 * and the visual proximity agree.
 */
export function StructuredFieldError({
  id,
  questionId,
  rowId,
  rowIndex,
  fieldKeys,
  errors,
  className,
}: StructuredFieldErrorProps) {
  const { t } = useTranslation();
  const [error] = selectStructuredFieldErrors(errors, {
    questionId,
    rowId,
    rowIndex,
    fieldKeys,
  });
  if (!error) return null;
  return (
    // role="alert" is REQUIRED here: QuestionBlock.tsx's block-level error
    // list filters field-bound errors out for structured questions
    // (avoiding the double print), so this is the only place a
    // field-bound structured error is ever announced. Message resolution
    // order matches the legacy `QuestionTypes/FieldError.tsx`; the colour
    // normalizes to the block list's text-red-600. Only the FIRST binding
    // error renders per slot — the rest stay available through the
    // matcher for the invalid ring.
    <p
      id={id}
      role="alert"
      className={cn("mt-1 text-sm text-red-600", className)}
    >
      {error.error ?? error.msg ?? t("field_required")}
    </p>
  );
}
