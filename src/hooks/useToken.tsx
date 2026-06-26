import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import queryClient from "@/Utils/request/queryClient";
import { useMutation } from "@tanstack/react-query";

export function useToken({
  facilityId,
  queueId,
  tokenId,
  onSuccess,
  patientId,
}: {
  facilityId: string;
  queueId: string;
  tokenId: string;
  patientId?: string;
  onSuccess?: () => void;
}) {
  const { mutate: updateToken, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId,
        id: tokenId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["token", tokenId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token", facilityId, queueId, tokenId],
      });
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, queueId],
      });
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: ["tokens", patientId, facilityId],
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

  return { updateToken, isUpdating };
}
