import { useCallback } from "react";

import type { ResponseValue } from "@/types/questionnaire/form";

/** Adapts the slot's `onChange` to the legacy `(values, questionId, note?)` callback. */
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
