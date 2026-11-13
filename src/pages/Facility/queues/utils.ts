import { TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";
import query from "@/Utils/request/query";
import { QueryParams } from "@/Utils/request/types";
import careConfig from "@careConfig";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
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
  const [{ autoRefresh }] = useQueryParams();
  return useInfiniteQuery({
    queryKey: ["infinite-tokens", facilityId, queueId, qParams],
    ...query.infinite(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queueId },
      pageSize: 50,
      queryParams: qParams,
    }),
    refetchInterval:
      autoRefresh === "true"
        ? careConfig.appointmentAndQueueRefreshInterval
        : false,
  });
}
