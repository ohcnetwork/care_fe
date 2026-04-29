import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { Widget } from "@/components/AIWidgets/types";

const STORAGE_KEY_PREFIX = "care_ai.widgets";

export function widgetsAtomFor(userId: string) {
  return atomWithStorage<Widget[]>(
    `${STORAGE_KEY_PREFIX}.${userId}`,
    [],
    createJSONStorage(() => localStorage),
  );
}

export function newWidgetId(): string {
  return `w_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
