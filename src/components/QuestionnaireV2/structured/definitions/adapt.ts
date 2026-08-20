import { useCallback } from "react";

import type { ResponseValue } from "@/types/questionnaire/form";

/** Legacy structured components call
 *  `updateQuestionnaireResponseCB(values, questionId, note?)`. The slot's
 *  `onChange` drops the redundant questionId (the slot already knows its
 *  question). Memoized because ChargeItemQuestion lists the callback in an
 *  effect dependency array — a fresh arrow per render is a loop hazard. */
export function useLegacyResponseCallback(
  onChange: (values: ResponseValue[], note?: string) => void,
) {
  return useCallback(
    (values: ResponseValue[], _questionId: string, note?: string) =>
      onChange(values, note),
    [onChange],
  );
}

export function sanitizeNote(note?: string | null): string | undefined {
  return note?.trim() ?? undefined;
}
