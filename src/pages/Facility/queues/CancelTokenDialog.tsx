import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { useUpdateToken } from "@/pages/Facility/queues/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

  const { mutate: updateToken, isPending } = useUpdateToken(facilityId, token, {
    onSuccess: () => {
      toast.success(t("token_has_been_cancelled"));
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
