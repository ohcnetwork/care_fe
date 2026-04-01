import { TokenRetrieve, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import queryClient from "@/Utils/request/queryClient";
import careConfig from "@careConfig";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
    refetchInterval:
      autoRefresh === "true"
        ? careConfig.appointmentAndQueueRefreshInterval
        : false,
  });
}

export function getTokenStatus({
  token,
  t,
}: {
  token: TokenRetrieve;
  t: (key: string) => string;
}) {
  if (token.status === TokenStatus.CREATED && token?.sub_queue?.id) {
    return t("called");
  }
  if (token.status === TokenStatus.CREATED) {
    return t("waiting");
  }
  return t(`${token.status.toLowerCase()}`);
}

export function useToken({
  facilityId,
  queueId,
  tokenId,
  onSuccess,
}: {
  facilityId: string;
  queueId: string;
  tokenId: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { data: token } = useQuery({
    queryKey: ["token", facilityId, queueId, tokenId],
    queryFn: query(tokenApi.get, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId ?? "",
        id: tokenId ?? "",
      },
    }),
    enabled: !!queueId && !!tokenId,
  });

  const { mutate: updateToken, isPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token?.queue.id ?? "",
        id: token?.id ?? "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token?.queue.id ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokens", token?.patient?.id, facilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token?.queue.id ?? ""],
      });
      toast.success(t("token_assigned_to_service_point"));
      onSuccess?.();
    },
  });

  return { token, updateToken, isPending };
}
