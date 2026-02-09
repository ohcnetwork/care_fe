import { LocationRead } from "@/types/location/location";
/**
 * Builds a location hierarchy path from a location object with parent references
 * @param location - The location object to build hierarchy for
 * @returns Array of location names from root to leaf, or formatted string if separator provided
 */
export function buildLocationHierarchy(location: LocationRead) {
  const hierarchy: string[] = [];
  let current: LocationRead | undefined = location;

  while (current) {
    if (current.name && current.name.trim()) {
      hierarchy.unshift(current.name.trim());
    }
    current = current.parent;
  }

  return hierarchy;
}

/**
 * Gets a formatted path string for a location showing its full hierarchy
 * @param location - The location object to get the path for
 * @param separator - The separator to use between path segments (default: " → ")
 * @returns Formatted path string from root to leaf (e.g., "Building A → Floor 1 → Room 101")
 */
export function getLocationPath(
  location: Pick<LocationRead, "name" | "parent">,
  separator = " → ",
): string {
  const path = [location.name];
  let current = location.parent;
  while (current && current.id) {
    path.unshift(current.name);
    current = current.parent;
  }
  return path.length > 1 ? path.join(separator) : path[0] || "";
}
