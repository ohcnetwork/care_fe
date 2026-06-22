import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import queryClient from "@/Utils/request/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useToken({
  facilityId,
  queueId,
  tokenId,
  onSuccess,
}: {
  facilityId: string;
  queueId: string;
  tokenId: string;
  onSuccess?: () => void;
}) {
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
        queue_id: queueId,
        id: tokenId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["token", facilityId, queueId, tokenId],
      });
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, queueId],
      });
      if (token?.patient?.id) {
        queryClient.invalidateQueries({
          queryKey: ["tokens", token.patient.id, facilityId],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["tokens"] });
      }
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
      onSuccess?.();
    },
  });

  return { token, updateToken, isPending };
}
