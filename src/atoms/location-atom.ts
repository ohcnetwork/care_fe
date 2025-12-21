import { atomFamily, atomWithStorage, createJSONStorage } from "jotai/utils";

import { LocationRead } from "@/types/location/location";

/**
 * Atom family for location caching per facility
 * Each facility gets its own atom with localStorage persistence
 */
export const locationAtomFamily = atomFamily((facilityId: string) =>
  atomWithStorage<LocationRead | null>(
    `location_cache--${facilityId}`,
    null,
    createJSONStorage(() => localStorage),
  ),
);

/**
 * Helper to invalidate all location caches
 * Removes all location_cache-- keys from localStorage
 */
export const invalidateAllLocationCaches = () => {
  for (const key in localStorage) {
    if (key.startsWith("location_cache--")) {
      localStorage.removeItem(key);
    }
  }
};
