import { atomFamily } from "jotai-family";
import { atomWithStorage } from "jotai/utils";

/**
 * Atom family for caching the last selected practitioner per facility
 * Uses localStorage to persist across sessions
 * Clears on login/logout
 */
export const queuePractitionerAtom = atomFamily((facilityId: string) =>
  atomWithStorage<string | null>(
    `care_queue_practitioner--${facilityId}`,
    null,
  ),
);

/**
 * Clear all queue practitioner caches from localStorage
 */
export const clearQueuePractitionerCache = () => {
  for (const key in localStorage) {
    if (key.startsWith("care_queue_practitioner--")) {
      localStorage.removeItem(key);
    }
  }
};
