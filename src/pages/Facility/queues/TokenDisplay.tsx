import { BatchRequestResponse } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenQueueRead } from "@/types/tokens/tokenQueue/tokenQueue";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

interface TokenDisplayProps {
  facilityId: string;
  resourceServicePoints: {
    resourceId: string;
    servicePoints: string[];
  }[];
  resourceType: SchedulableResourceType;
}

export const TokenDisplay = ({
  facilityId,
  resourceServicePoints,
  resourceType,
}: TokenDisplayProps) => {
  const { data: resourceQueues } = useQuery({
    queryKey: ["queues", facilityId, resourceType],
    queryFn: query(batchApi.batchRequest, {
      body: {
        requests: resourceServicePoints.map((resource) => ({
          url: `/api/v1/facility/${facilityId}/token/queue/?resource_type=${resourceType}&resource_id=${resource.resourceId}&date=${dayjs().format("YYYY-MM-DD")}`,
          method: "GET",
          reference_id: `${resource.resourceId}`,
        })),
      },
    }),
    select: (data: BatchRequestResponse<PaginatedResponse<TokenQueueRead>>) => {
      const obj: Record<string, string> = {};
      data.results.forEach((result) => {
        obj[result.reference_id] =
          result.data?.results.find((queue) => queue.is_primary)?.id ?? "";
      });

      return obj;
    },
  });

  console.log(resourceQueues, "resourceQues");

  const { data: resourceTokens } = useQuery({
    queryKey: ["tokens", facilityId, resourceType],
    queryFn: query(batchApi.batchRequest, {
      body: {
        requests: Object.entries(resourceQueues ?? {}).map(
          ([reference_id, queue_id]) => ({
            url: `/api/v1/facility/${facilityId}/token/queue/${queue_id}/token/`,
            method: "GET",
            reference_id,
          }),
        ),
      },
    }),
    enabled: !!resourceQueues,
  });

  console.log(resourceTokens);

  return (
    <div>
      {resourceTokens?.results.map((result) => (
        <div key={result.reference_id}>{JSON.stringify(result.data)}</div>
      ))}
    </div>
  );
};
