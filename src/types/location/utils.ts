import { LocationRead } from "@/types/location/location";

/**
 * Builds a location hierarchy array from a location object with parent references
 * @param location - The location object to build hierarchy for
 * @returns Array of LocationRead objects from root to leaf
 */
export function buildLocationPath(location: LocationRead): LocationRead[] {
  const path: LocationRead[] = [location];
  let current = location.parent;

  while (current && current.id) {
    path.unshift(current);
    current = current.parent;
  }

  return path;
}

/**
 * Gets a formatted path string for a location showing its full hierarchy
 * @param location - The location object to get the path for
 * @param separator - The separator to use between path segments (default: " → ")
 * @param excludeCurrent - Whether to exclude the current location from the path (default: false)
 * @returns Formatted path string from root to leaf (e.g., "Building A → Floor 1 → Room 101")
 */
export function getLocationPath(
  location: Pick<LocationRead, "name" | "parent">,
  separator = " → ",
  excludeCurrent = false,
): string {
  const path: string[] = excludeCurrent ? [] : [location.name];
  let current = location.parent;
  while (current && current.id) {
    path.unshift(current.name);
    current = current.parent;
  }
  return path.length > 1 ? path.join(separator) : path[0] || "";
}
