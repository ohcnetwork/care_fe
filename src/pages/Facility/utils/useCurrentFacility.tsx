import { useQuery } from "@tanstack/react-query";
import { useFullPath } from "raviger";

import query from "@/Utils/request/query";
import facilityApi from "@/types/facility/facilityApi";

/**
 * Reads the facility id from the route path.
 *
 * @returns The facility id, or `undefined` if the path is not a facility route.
 */
const extractFacilityId = (path: string) => {
  const segments = path.split("/");

  if (segments[1] === "facility" && segments[2]) {
    return segments[2];
  }

  return undefined;
};

/**
 * Avoids fetching the facility data on all places the current facility is needed.
 *
 * Use this hook outside a facility route. It returns `undefined` values there.
 *
 * @returns The current facility in context, if there is one.
 */
export function useCurrentFacilitySilently() {
  const path = useFullPath();
  const facilityId = extractFacilityId(path);

  const { data: facility, isLoading: isFacilityLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: facilityId ?? "" },
    }),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    enabled: !!facilityId,
  });

  return { facilityId, facility, isFacilityLoading };
}

/**
 * Avoids fetching the facility data on all places the current facility is needed.
 *
 * Use this hook only inside a facility route. It throws an error elsewhere.
 *
 * @returns The current facility in context.
 */
export default function useCurrentFacility() {
  // Call the hook first. React must always see the same hooks in the same order.
  const { facilityId, facility, isFacilityLoading } =
    useCurrentFacilitySilently();

  if (!facilityId) {
    throw new Error(
      "'useCurrentFacility' must be used within a facility route",
    );
  }

  return { facilityId, facility, isFacilityLoading };
}
