import { TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";
import query from "@/Utils/request/query";
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
const PAGE_SIZE = 50;

export function useTokenListInfiniteQuery({
  facilityId,
  queueId,
  qParams,
}: {
  facilityId: string;
  queueId: string;
  qParams?: Record<string, unknown>;
}) {
  const [{ autoRefresh }] = useQueryParams();
  return useInfiniteQuery({
    queryKey: ["infinite-tokens", facilityId, queueId, qParams],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(tokenApi.list, {
        pathParams: { facility_id: facilityId, queue_id: queueId },
        queryParams: {
          ...qParams,
          limit: PAGE_SIZE,
          offset: pageParam,
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_SIZE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    refetchInterval: autoRefresh === "true" ? 10000 : false,
  });
}
