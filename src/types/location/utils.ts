import { LocationList } from "@/types/location/location";
/**
 * Builds a location hierarchy path from a location object with parent references
 * @param location - The location object to build hierarchy for
 * @returns Array of location names from root to leaf, or formatted string if separator provided
 */
export function buildLocationHierarchy(location: LocationList) {
  const hierarchy: string[] = [];
  let current: LocationList | undefined = location;

  while (current) {
    if (current.name && current.name.trim()) {
      hierarchy.unshift(current.name.trim());
    }
    current = current.parent;
  }

  return hierarchy;
}
