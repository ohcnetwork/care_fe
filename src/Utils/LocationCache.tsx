import { LocationList } from "@/types/location/location";

/**
 * Returns the location cache key for the given facility
 */
const getKey = (facilityId: string) => {
  return `location_cache--${facilityId}`;
};

/**
 * Retrieves the cached location for a facility
 */
const get = (facilityId: string): LocationList | null => {
  try {
    const key = getKey(facilityId);
    const content = localStorage.getItem(key);
    return content ? (JSON.parse(content) as LocationList) : null;
  } catch {
    return null;
  }
};

/**
 * Sets the location cache for a facility
 */
const set = (location: LocationList, facilityId: string) => {
  const key = getKey(facilityId);
  localStorage.setItem(key, JSON.stringify(location));
};

/**
 * Removes the location cache for a specific facility
 */
const invalidate = (facilityId: string) => {
  const key = getKey(facilityId);
  localStorage.removeItem(key);
};

/**
 * Removes all location caches across all facilities
 */
const invalidateAll = () => {
  for (const key in localStorage) {
    if (key.startsWith("location_cache--")) {
      localStorage.removeItem(key);
    }
  }
};

export default {
  get,
  set,
  invalidate,
  invalidateAll,
};
