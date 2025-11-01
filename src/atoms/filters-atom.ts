import { atomWithStorage, createJSONStorage } from "jotai/utils";

type Filters = Record<string, unknown>;

/**
 * Global filter state atom using localStorage.
 * This atom stores all filters for different pages/routes.
 * Filters persist until user logout or manual change.
 *
 * TODO: Future enhancement - Migrate from FiltersCache to use this Jotai atom
 * for better state management and reactivity. This would allow real-time
 * filter updates across components without manual localStorage management.
 *
 * @see FiltersCache in src/Utils/FiltersCache.tsx for current implementation
 */
export const filtersAtom = atomWithStorage<Record<string, Filters>>(
  "care-filters",
  {},
  createJSONStorage(() => localStorage),
);
