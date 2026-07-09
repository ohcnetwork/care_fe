import { TokenRead } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import queryClient from "@/Utils/request/queryClient";
import { useMutation } from "@tanstack/react-query";

export function useUpdateToken({
  facilityId,
  token,
  onSuccess,
}: {
  facilityId: string;
  token: TokenRead;
  onSuccess?: () => void;
}) {
  return useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token.queue.id,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["token", token.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token", facilityId, token.queue.id, token.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token.queue.id],
      });
      if (token.patient?.id) {
        queryClient.invalidateQueries({
          queryKey: ["tokens", token.patient.id, facilityId],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["tokens"] });
      }
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token.queue.id],
      });
      onSuccess?.();
    },
  });
}
