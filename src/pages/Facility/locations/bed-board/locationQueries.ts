import query from "@/Utils/request/query";
import { LocationMode } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

/** The locations of the departments that the user belongs to. */
export function myLocationsQuery(facilityId: string) {
  return {
    queryKey: ["locations", facilityId, "mine", "kind"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mine: true, mode: "kind" },
    }),
  };
}

/**
 * All direct children of a location in one mode: `kind` for sub-locations,
 * `instance` for beds. Callers enable it only when the parent's
 * `has_sub_locations` or `has_beds` flag says there is something to fetch.
 * It asks for 100 at a time and keeps going until it has them all, so the
 * counts and the search cover the whole location.
 */
export function locationChildrenQuery(
  facilityId: string,
  parentId: string,
  mode: LocationMode,
) {
  return {
    queryKey: ["locations", facilityId, "children", parentId, mode, "all"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { parent: parentId, mode },
      pageSize: 100,
    }),
  };
}

export function locationQuery(facilityId: string, locationId: string) {
  return {
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
      silent: true,
    }),
  };
}

/**
 * Every location in the facility that holds beds, through the list's
 * `has_beds` filter. Each one comes with its chain of parents, so this one
 * list says which branches of the tree lead to a bed.
 */
export function locationsWithBedsQuery(facilityId: string) {
  return {
    queryKey: ["locations", facilityId, "with-beds"],
    // The tree, each of its rows and the board all read this list. Which
    // locations hold beds rarely changes, so they share one fetch instead of
    // each asking again when it appears.
    staleTime: 5 * 60 * 1000,
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode: "kind", has_beds: true },
      pageSize: 100,
    }),
  };
}
