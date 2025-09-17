import {
  SchedulableResourceType,
  ScheduleResource,
} from "@/types/scheduling/schedule";
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

  return {
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
