import { useQuery } from "@tanstack/react-query";

import { LocationRead } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

import { locationsWithBedsQuery } from "./locationQueries";

/**
 * Keeps the locations that hold a bed, or have one somewhere below them. A
 * bed board has nothing to show for the rest.
 *
 * It asks once for every location that holds beds. A location leads to a bed
 * when it is one of them or is on the chain of parents of one of them.
 */
export function useLocationsWithBeds(
  facilityId: string,
  locations: LocationRead[] | undefined,
) {
  const { data, isLoading, isError } = useQuery(
    locationsWithBedsQuery(facilityId),
  );
  const leadingToBeds = new Set(
    (data?.results ?? [])
      // A backend without the filter returns every location: check the flag too.
      .filter((location) => location.has_beds)
      .flatMap((location) => buildLocationPath(location))
      .map((location) => location.id),
  );

  return {
    isLoading,
    locations: (locations ?? []).filter(
      (location) =>
        location.has_beds ||
        leadingToBeds.has(location.id) ||
        // If the list failed to load, keep what may lead to beds rather than hide it.
        (isError && location.has_sub_locations),
    ),
  };
}
