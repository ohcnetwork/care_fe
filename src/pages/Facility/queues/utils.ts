import { useQueryParams } from "@/lib/router/queryParams";
import { queueBoardSearch } from "@/lib/router/search/queues";
import { TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";
import query from "@/Utils/request/query";
import { QueryParams } from "@/Utils/request/types";
import careConfig from "@careConfig";
import { useInfiniteQuery } from "@tanstack/react-query";

import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

/**
 * The queue board URL of a queue. The same pages render under a practitioner,
 * a location and a healthcare service, so the prefix comes from the resource.
 */
export function getQueueBoardPath({
  facilityId,
  resourceType,
  resourceId,
  queueId,
  tab,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  queueId: string;
  tab: "ongoing" | "completed";
}) {
  return `/facility/${facilityId}/${resourceTypeToResourcePathSlug[resourceType]}/${resourceId}/queues/${queueId}/${tab}`;
}

export function getTokenQueueStatusCount(
  summary: TokenQueueSummary,
  ...statuses: TokenStatus[]
) {
  return statuses.reduce((acc, status) => {
    Object.values(summary).forEach((category) => {
      acc += category[status] ?? 0;
    });
    return acc;
  }, 0);
}

export function useTokenListInfiniteQuery({
  facilityId,
  queueId,
  qParams,
}: {
  facilityId: string;
  queueId: string;
  qParams?: QueryParams;
}) {
  const [{ autoRefresh }] = useQueryParams(queueBoardSearch);
  return useInfiniteQuery({
    queryKey: ["infinite-tokens", facilityId, queueId, qParams],
    ...query.infinite(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queueId },
      pageSize: 50,
      queryParams: qParams,
    }),
    refetchInterval:
      autoRefresh === true
        ? careConfig.appointmentAndQueueRefreshInterval
        : false,
  });
}
