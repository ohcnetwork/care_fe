import query from "@/Utils/request/query";
import { useScheduleResourceFromPath } from "@/components/Schedule/useScheduleResource";
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

export function useQueueServicePoints() {
  const { resourceType, resourceId, facilityId } =
    useScheduleResourceFromPath();
  const [assignedServicePoints, setAssignedServicePoints] = useAtom(atom);
  const servicPointKey = `${resourceType}:${resourceId}`;

  const { data: subQueues, isLoading } = useQuery({
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
  });

  const allServicePoints = subQueues?.results ?? [];
  const allServicePointIds = allServicePoints.map((subQueue) => subQueue.id);
  const availableServicePointIds = new Set(allServicePointIds);

  const assignedServicePointIds =
    assignedServicePoints[servicPointKey] ?? allServicePointIds;

  const normalizedAssignedServicePointIds = assignedServicePointIds.filter(
    (id) => availableServicePointIds.has(id),
  );

  const normalizedAssignedServicePointIdSet = new Set(
    normalizedAssignedServicePointIds,
  );
  const normalizedAssignedServicePoints = allServicePoints.filter(({ id }) =>
    normalizedAssignedServicePointIdSet.has(id),
  );

  return {
    allServicePoints,
    assignedServicePointIds: normalizedAssignedServicePointIds,
    assignedServicePoints: normalizedAssignedServicePoints,
    isLoading,

    toggleServicePoint: (subQueueId: string, checked: boolean) => {
      const updated = new Set(normalizedAssignedServicePointIds);
      updated[checked ? "add" : "delete"](subQueueId);

      setAssignedServicePoints({
        ...assignedServicePoints,
        [servicPointKey]:
          updated.size !== allServicePoints.length ? [...updated] : undefined,
      });
    },
  } as const;
}
