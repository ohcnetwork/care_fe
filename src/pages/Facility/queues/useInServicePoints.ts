import query from "@/Utils/request/query";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  SchedulableResourceType,
  ScheduleResource,
} from "@/types/scheduling/schedule";
import { TokenSubQueueStatus } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const atom = atomWithStorage<Record<string, string[] | undefined>>(
  "care_queues_service_points",
  {},
  undefined,
  { getOnInit: true },
);

export function useInServicePoints({
  resource,
  resourceType,
}: {
  resource: ScheduleResource;
  resourceType: SchedulableResourceType;
}) {
  const [assignedServicePoints, setAssignedServicePoints] = useAtom(atom);
  const servicPointKey = `service_point_${resource?.resource.id}_${resourceType}`;
  const servicePointIds = assignedServicePoints[servicPointKey];
  const { facilityId } = useCurrentFacility();

  const { data: subQueues } = useQuery({
    queryKey: ["servicePoints", facilityId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resource.resource.id,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
        status: TokenSubQueueStatus.ACTIVE,
      },
    }),
  });

  return {
    subQueues: subQueues?.results || [],
    servicePointIds: servicePointIds || [],

    setServicePointIds: (subQueueId: string, checked: boolean) => {
      let updated = checked
        ? [...(servicePointIds || []), subQueueId]
        : servicePointIds?.filter((id) => id !== subQueueId);

      if (checked) {
        updated = [...new Set([...(servicePointIds || []), subQueueId])];
      } else {
        updated = servicePointIds?.filter((id) => id !== subQueueId);
      }

      if (
        updated &&
        updated.length > 0 &&
        updated.length !== servicePointIds?.length
      ) {
        setAssignedServicePoints({
          ...assignedServicePoints,
          [servicPointKey]: updated,
        });
      } else {
        setAssignedServicePoints({
          ...assignedServicePoints,
          [servicPointKey]: undefined,
        });
      }
    },
  } as const;
}
