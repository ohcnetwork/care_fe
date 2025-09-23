import { TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";

import query from "@/Utils/request/query";
import { useInfiniteQuery } from "@tanstack/react-query";
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
  status,
  qParams,
  refetch,
}: {
  facilityId: string;
  queueId: string;
  status?: TokenStatus[];
  qParams?: Record<string, unknown>;
  refetch: boolean;
}) {
  return useInfiniteQuery({
    queryKey: [
      "infinite-tokens",
      facilityId,
      queueId,
      qParams,
      { status: status },
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(tokenApi.list, {
        pathParams: { facility_id: facilityId, queue_id: queueId },
        queryParams: {
          ...qParams,
          limit: PAGE_SIZE,
          offset: pageParam,
          status: status?.join(","),
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_SIZE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    refetchInterval: refetch ? 10000 : false,
  });
}
