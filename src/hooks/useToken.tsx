import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import queryClient from "@/Utils/request/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
