import facilityApi from "@/types/facility/facilityApi";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";
import locationApi from "@/types/location/locationApi";
import {
  SchedulableResourceType,
  ScheduleResource,
} from "@/types/scheduling/schedule";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { useFullPath } from "raviger";

const resourceTypePathSlugToResourceType = {
  practitioner: SchedulableResourceType.Practitioner,
  locations: SchedulableResourceType.Location,
  services: SchedulableResourceType.HealthcareService,
};

export const resourceTypeToResourcePathSlug = {
  [SchedulableResourceType.Practitioner]: "practitioner",
  [SchedulableResourceType.Location]: "locations",
  [SchedulableResourceType.HealthcareService]: "services",
};

const extractPathParams = (path: string) => {
  const segments = path.split("/");

  if (
    segments[1] === "facility" &&
    segments[2] &&
    segments[3] in resourceTypePathSlugToResourceType &&
    segments[4]
  ) {
    return {
      facilityId: segments[2],
      resourceType:
        resourceTypePathSlugToResourceType[
          segments[3] as keyof typeof resourceTypePathSlugToResourceType
        ],
      resourceId: segments[4],
    };
  }

  throw new Error("'useCurrentFacility' must be used within a facility route");
};

export function useScheduleResourceFromPath() {
  const path = useFullPath();
  return extractPathParams(path);
}

export function useScheduleResource(): ScheduleResource | undefined {
  const path = useFullPath();
  const { facilityId, resourceType, resourceId } = extractPathParams(path);

  const practitionerQuery = useQuery({
    queryKey: ["facility-user", facilityId, resourceId],
    queryFn: query(facilityApi.getUser, {
      pathParams: { facilityId, userId: resourceId },
    }),
    enabled: resourceType === SchedulableResourceType.Practitioner,
  });

  const locationQuery = useQuery({
    queryKey: ["location", facilityId, resourceId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: resourceId },
    }),
    enabled: resourceType === SchedulableResourceType.Location,
  });

  const healthcareServiceQuery = useQuery({
    queryKey: ["service", facilityId, resourceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: { facilityId, healthcareServiceId: resourceId },
    }),
    enabled: resourceType === SchedulableResourceType.HealthcareService,
  });

  if (resourceType === SchedulableResourceType.Practitioner) {
    return (
      practitionerQuery.data && {
        resource_type: resourceType,
        resource: practitionerQuery.data,
      }
    );
  }

  if (resourceType === SchedulableResourceType.Location) {
    return (
      locationQuery.data && {
        resource_type: resourceType,
        resource: locationQuery.data,
      }
    );
  }

  if (resourceType === SchedulableResourceType.HealthcareService) {
    return (
      healthcareServiceQuery.data && {
        resource_type: resourceType,
        resource: healthcareServiceQuery.data,
      }
    );
  }

  throw new Error(`Invalid resource type: ${resourceType}`);
}
