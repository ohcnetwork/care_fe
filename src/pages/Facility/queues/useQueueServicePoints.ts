import query from "@/Utils/request/query";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenSubQueueStatus } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const atom = atomWithStorage<Record<string, string[] | undefined>>(
  "care_queue_service_points",
  {},
  undefined,
  { getOnInit: true },
);

export function useQueueServicePoints({
  facilityId,
  resourceType,
  resourceId,
  enabled = true,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  enabled?: boolean;
}) {
  const [assignedServicePoints, setAssignedServicePoints] = useAtom(atom);
  const servicePointKey = `${facilityId}:${resourceType}:${resourceId}`;

  const { data: subQueues, isPending: isServicePointsLoading } = useQuery({
    queryKey: ["servicePoints", facilityId, resourceType, resourceId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
        status: TokenSubQueueStatus.ACTIVE,
      },
    }),
    enabled,
  });

  const allServicePoints = subQueues?.results;

  const assignedServicePointIds =
    assignedServicePoints[servicePointKey] ??
    allServicePoints?.map((subQueue) => subQueue.id) ??
    [];

  return {
    allServicePoints,
    assignedServicePointIds,
    isServicePointsLoading,
    assignedServicePoints:
      allServicePoints?.filter(({ id }) =>
        assignedServicePointIds.includes(id),
      ) ?? [],

    toggleServicePoint: (subQueueId: string, checked: boolean) => {
      const updated = new Set([...assignedServicePointIds]);
      updated[checked ? "add" : "delete"](subQueueId);

      setAssignedServicePoints({
        ...assignedServicePoints,
        [servicePointKey]:
          updated.size !== allServicePoints?.length ? [...updated] : undefined,
      });
    },
  } as const;
}
