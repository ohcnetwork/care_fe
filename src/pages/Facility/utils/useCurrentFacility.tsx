import { useQuery } from "@tanstack/react-query";
import { useFullPath } from "raviger";

import query from "@/Utils/request/query";
import facilityApi from "@/types/facility/facilityApi";

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
 * @returns The current facility in context.
 */
export default function useCurrentFacility() {
  const context = useCurrentFacilitySilently();

  if (!context.facilityId) {
    throw new Error(
      "'useCurrentFacility' must be used within a facility route",
    );
  }

  return { ...context, facilityId: context.facilityId };
}

export function useCurrentFacilitySilently() {
  const path = useFullPath();
  const facilityId = extractFacilityId(path);

  const { data: facility, isLoading: isFacilityLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: facilityId ?? "" },
    }),
    enabled: !!facilityId,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  return { facilityId, facility, isFacilityLoading };
}
