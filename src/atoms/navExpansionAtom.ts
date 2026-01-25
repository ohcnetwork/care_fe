import { atomFamily } from "jotai-family";
import { atomWithStorage } from "jotai/utils";

/**
 * Atom family for navigation expansion state per nav item
 * Uses localStorage to persist expansion state across sessions
 */
export const navExpansionAtom = atomFamily((linkName: string) =>
  atomWithStorage<boolean | null>(`nav-expansion-state--${linkName}`, null),
);
