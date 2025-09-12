import { LocationList } from "@/types/location/location";
/**
 * Builds a location hierarchy path from a location object with parent references
 * @param location - The location object to build hierarchy for
 * @param separator - The separator to use between location names (optional)
 * @returns Array of location names from root to leaf, or formatted string if separator provided
 */
export function buildLocationHierarchy(
  location: LocationList,
  separator?: string,
): string[] | string {
  const hierarchy: string[] = [];
  let current: LocationList | undefined = location;

  while (current) {
    if (current.name && current.name.trim()) {
      hierarchy.unshift(current.name.trim());
    }
    current = current.parent;
  }

  return separator ? hierarchy.join(separator) : hierarchy;
}
