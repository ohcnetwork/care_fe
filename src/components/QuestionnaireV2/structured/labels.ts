import type { TFunction } from "i18next";

import { isCoreStructuredType } from "@/types/questionnaire/structured";

// Kept out of `registry.ts` so label-only consumers (badges, lists) don't pull
// in every structured input component.
export function structuredTypeLabel(type: string, t: TFunction): string {
  return isCoreStructuredType(type) ? t(`structured_type__${type}`) : type;
}
