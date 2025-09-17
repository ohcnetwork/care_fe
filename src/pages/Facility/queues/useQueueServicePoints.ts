import query from "@/Utils/request/query";
import { useScheduleResourceFromPath } from "@/components/Schedule/useScheduleResource";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
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

export function useQueueServicePoints() {
  const { resourceType, resourceId } = useScheduleResourceFromPath();
  const [assignedServicePoints, toggleServicePoint] = useAtom(atom);
  const servicPointKey = `service_point_${resourceId}_${resourceType}`;
  const servicePointIds = assignedServicePoints[servicPointKey];
  const { facilityId } = useCurrentFacility();

  const { data: subQueues } = useQuery({
    queryKey: ["servicePoints", facilityId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
        status: TokenSubQueueStatus.ACTIVE,
      },
    }),
  });

  return {
    allServicePoints: subQueues?.results,
    assignedServicePointIds: servicePointIds || [],
    assignedServicePoints:
      servicePointIds &&
      subQueues &&
      servicePointIds.length > 0 &&
      subQueues.results.length > 0
        ? subQueues.results.filter((subQueue) =>
            servicePointIds.includes(subQueue.id),
          )
        : [],

    toggleServicePoint: (subQueueId: string, checked: boolean) => {
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
        toggleServicePoint({
          ...assignedServicePoints,
          [servicPointKey]: updated,
        });
      } else {
        toggleServicePoint({
          ...assignedServicePoints,
          [servicPointKey]: undefined,
        });
      }
    },
  } as const;
}
