import { atomWithStorage } from "jotai/utils";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

/**
 * Atom for caching the last selected schedule service type (practitioner/healthservice/location)
 * Uses localStorage to persist across sessions and logouts
 * Only clears on cache/localStorage clear
 *
 * `getOnInit: true` — REVIEW FIX. Without it, `atomWithStorage` resolves to
 * `initialValue` (Practitioner) on the very FIRST render and only reads
 * `localStorage` in its `onMount`, which runs after mount. Any consumer
 * that reads this atom to seed its OWN first-render state (`AppointmentEditor`'s
 * `useState(() => initialResource(serviceType, currentUser))`,
 * `AppointmentQuestion.tsx`'s identical pattern) captures the pre-hydration
 * default and never sees the real persisted value unless it also runs a
 * reconciling effect after the atom updates. `getOnInit: true` reads
 * `localStorage` synchronously during the atom's own initialization instead,
 * so every consumer's first render already reflects the real preference —
 * no race, no reconciling effect required.
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
