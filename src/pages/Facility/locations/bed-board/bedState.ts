import { LocationRead } from "@/types/location/location";

export type BedState = "patient" | "reserved" | "free" | "unavailable";

/**
 * A bed with a patient always reads as occupied, whatever its other fields
 * say, so a patient is never hidden behind a stale status.
 *
 * Assigning a bed to an encounter marks it occupied straight away. Until the
 * patient is on it the bed has no current encounter, so "occupied with nobody
 * on it" is a bed reserved for someone.
 */
export function getBedState(bed: LocationRead): BedState {
  if (bed.current_encounter) return "patient";
  if (bed.status !== "active") return "unavailable";
  if (bed.operational_status === "U") return "free";
  if (bed.operational_status === "O") return "reserved";
  return "unavailable";
}

/** Matches the bed's name or its patient's name, ignoring case. */
export function matchesBedSearch(bed: LocationRead, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return [bed.name, bed.current_encounter?.patient?.name].some((value) =>
    value?.toLowerCase().includes(term),
  );
}

export type BedCounts = Record<BedState | "total", number>;

export function countBeds(beds: LocationRead[]): BedCounts {
  const counts = {
    total: beds.length,
    patient: 0,
    reserved: 0,
    free: 0,
    unavailable: 0,
  };
  for (const bed of beds) counts[getBedState(bed)]++;
  return counts;
}
