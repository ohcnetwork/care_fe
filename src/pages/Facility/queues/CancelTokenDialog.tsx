import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export function CancelTokenDialog({
  open,
  onOpenChange,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
}) {
  const { facilityId } = useCurrentFacility();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateToken, isPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token.queue.id,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token.queue.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token.queue.id],
      });
      onOpenChange(false);
    },
  });

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("cancel_token")}
      description={t("cancel_token_confirmation", {
        patientName: token.patient?.name,
        tokenNumber: renderTokenNumber(token),
      })}
      onConfirm={() =>
        updateToken({
          status: TokenStatus.CANCELLED,
          note: token.note,
          sub_queue: null,
        })
      }
      cancelText={t("cancel")}
      confirmText={t("cancel_token")}
      variant="destructive"
      disabled={isPending}
    />
  );
}
