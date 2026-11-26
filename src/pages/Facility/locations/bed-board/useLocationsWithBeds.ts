import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { LocationRead } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

import { locationsWithBedsQuery } from "./locationQueries";

/**
 * Keeps the locations that hold a bed, or have one somewhere below them. A
 * bed board has nothing to show for the rest.
 *
 * It asks once for every location that holds beds. A location leads to a bed
 * when it is one of them or is on the chain of parents of one of them.
 *
 * `filterWithBeds` applies the same filter to any list later, so a tree reads
 * the list once and filters the children of every node with it.
 *
 * `hasBedsBelow` says if a bed sits in a location deeper than the location
 * itself, so a tree can tell before it fetches anything whether a location
 * has something to expand.
 */
export function useLocationsWithBeds(
  facilityId: string,
  locations: LocationRead[] | undefined,
) {
  const bedLocations = useBedLocations(facilityId);
  return { ...bedLocations, locations: bedLocations.filterWithBeds(locations) };
}

/**
 * The same filters as `useLocationsWithBeds`, for callers that have no list
 * to filter yet, such as a tree that filters the children of each node.
 */
export function useBedLocations(facilityId: string) {
  const { data, isLoading, isError } = useQuery(
    locationsWithBedsQuery(facilityId),
  );
  const { leadingToBeds, holdingBedsBelow } = useMemo(() => {
    const leadingToBeds = new Set<string>();
    const holdingBedsBelow = new Set<string>();
    (data?.results ?? [])
      // A backend without the filter returns every location: check the flag too.
      .filter((location) => location.has_beds)
      .forEach((location) => {
        const path = buildLocationPath(location);
        path.forEach((step) => leadingToBeds.add(step.id));
        path.slice(0, -1).forEach((step) => holdingBedsBelow.add(step.id));
      });
    return { leadingToBeds, holdingBedsBelow };
  }, [data]);

  const filterWithBeds = (candidates: LocationRead[] | undefined) =>
    (candidates ?? []).filter(
      (location) =>
        location.has_beds ||
        leadingToBeds.has(location.id) ||
        // If the list failed to load, keep what may lead to beds rather than hide it.
        (isError && location.has_sub_locations),
    );

  return {
    isLoading,
    filterWithBeds,
    hasBedsBelow: (location: LocationRead) =>
      holdingBedsBelow.has(location.id) ||
      (isError && location.has_sub_locations),
  };
}
