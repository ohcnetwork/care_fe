import { atomWithStorage } from "jotai/utils";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

/**
 * Atom for caching the last selected schedule service type (practitioner/healthservice/location)
 * Uses localStorage to persist across sessions and logouts
 * Only clears on cache/localStorage clear
 */
export const SCHEDULE_SERVICE_TYPE_KEY = "care_schedule_service_type";

export const scheduleServiceTypeAtom = atomWithStorage<SchedulableResourceType>(
  SCHEDULE_SERVICE_TYPE_KEY,
  SchedulableResourceType.Practitioner,
);

/**
 * Clear the schedule service type cache from localStorage
 */
export const clearScheduleServiceTypeCache = () => {
  localStorage.removeItem(SCHEDULE_SERVICE_TYPE_KEY);
};
