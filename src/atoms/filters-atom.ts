import { atomWithStorage, createJSONStorage } from "jotai/utils";

type Filters = Record<string, unknown>;

/**
 * Global filter state atom using localStorage.
 * This atom stores all filters for different pages/routes.
 * Filters persist until user logout or manual change.
 */
export const filtersAtom = atomWithStorage<Record<string, Filters>>(
  "care-filters",
  {},
  createJSONStorage(() => localStorage),
);
