import { useQuery } from "@tanstack/react-query";
import { useFullPath } from "raviger";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

const extractFacilityId = (path: string) => {
  const segments = path.split("/");

  if (segments[1] === "facility" && segments[2]) {
    return segments[2];
  }

  throw new Error("'useCurrentFacility' must be used within a facility route");
};

/**
 * Avoids fetching the facility data on all places the current facility is needed.
 *
 * @returns The current facility in context.
 */
export default function useCurrentFacility() {
  const path = useFullPath();
  const facilityId = extractFacilityId(path);

  const { data: facility } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId ?? "" },
    }),
    staleTime: 1000 * 60 * 30, // cache for 30 minutes
  });

  return { facilityId, facility };
}
