import { useQuery } from "@tanstack/react-query";
import { useFullPath } from "raviger";

import query from "@/Utils/request/query";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

const extractFacilityServiceId = (path: string) => {
  const segments = path.split("/");

  if (
    segments[1] === "facility" &&
    segments[2] &&
    segments[3] === "services" &&
    segments[4]
  ) {
    return [segments[2], segments[4]] as const;
  }

  throw new Error(
    "'useCurrentService' must be used within a facility's service route",
  );
};

export default function useCurrentService() {
  const path = useFullPath();
  const [facilityId, serviceId] = extractFacilityServiceId(path);

  const { data: service } = useQuery({
    queryKey: ["service", facilityId, serviceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: { facilityId: facilityId, healthcareServiceId: serviceId },
    }),
    staleTime: 1000 * 60 * 30, // cache for 30 minutes
  });

  return { facilityId, serviceId, service };
}

export function useCurrentServiceSilently() {
  try {
    return useCurrentService();
  } catch {
    return {
      facilityId: undefined,
      serviceId: undefined,
      service: undefined,
    };
  }
}
