import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import { usePathname } from "@/lib/router/location";
import locationApi from "@/types/location/locationApi";

const extractFacilityLocationId = (path: string) => {
  const segments = path.split("/");

  if (
    segments[1] === "facility" &&
    segments[2] &&
    segments[3] === "locations" &&
    segments[4]
  ) {
    return [segments[2], segments[4]] as const;
  }

  throw new Error(
    "'useCurrentLocation' must be used within a facility's location route",
  );
};

export default function useCurrentLocation() {
  const path = usePathname();
  const [facilityId, locationId] = extractFacilityLocationId(path);

  const { data: location, isLoading } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
    staleTime: 1000 * 60 * 30, // cache for 30 minutes
  });

  return { facilityId, locationId, location, isLoading };
}
