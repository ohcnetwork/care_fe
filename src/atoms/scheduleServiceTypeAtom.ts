import { atomWithStorage } from "jotai/utils";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

/**
 * Atom for caching the last selected schedule service type (practitioner/healthservice/location)
 * Uses localStorage to persist across sessions and logouts
 * Only clears on cache/localStorage clear
 *
 * `getOnInit: true` is load-bearing: without it, `atomWithStorage`
 * resolves to `initialValue` (Practitioner) on the first render and only
 * reads `localStorage` in its `onMount`, so a consumer that seeds its own
 * first-render state from this atom (e.g. `AppointmentQuestion`'s
 * `useState(() => getInitialResourceState(cachedServiceType, currentUser))`) captures
 * the pre-hydration default. With it, `localStorage` is read synchronously
 * once when the atom is constructed, so every consumer's first render
 * already reflects the persisted preference.
 */
export const SCHEDULE_SERVICE_TYPE_KEY = "care_schedule_service_type";

export const scheduleServiceTypeAtom = atomWithStorage<SchedulableResourceType>(
  SCHEDULE_SERVICE_TYPE_KEY,
  SchedulableResourceType.Practitioner,
  undefined,
  { getOnInit: true },
);

/**
 * Clear the schedule service type cache from localStorage
 */
export const clearScheduleServiceTypeCache = () => {
  localStorage.removeItem(SCHEDULE_SERVICE_TYPE_KEY);
};
