import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ReferralAvailabilityRead } from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";
import { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

interface DeleteReferralAvailabilityDialogProps {
  availability: ReferralAvailabilityRead;
  canManage: boolean;
  onClose: () => void;
  onDeleted: (availabilityId: string) => void;
}

export function DeleteReferralAvailabilityDialog({
  availability,
  canManage,
  onClose,
  onDeleted,
}: DeleteReferralAvailabilityDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const deletion = useMutation({
    mutationFn: async () => {
      try {
        await callApi(referralAvailabilityApi.delete, {
          pathParams: { availabilityId: availability.id },
          silent: true,
        });
      } catch (error) {
        // A prior request may have succeeded even if its response was lost.
        if (!(error instanceof HTTPError && error.status === 404)) throw error;
      }
    },
    retry: false,
    onSuccess: () => {
      onDeleted(availability.id);
      void queryClient.invalidateQueries({
        queryKey: ["referral-availability-config"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["referral-availabilities"],
      });
      // The editor closes on deletion; do not refetch its now-deleted record.
      void queryClient.invalidateQueries({
        queryKey: ["referral-availability"],
        refetchType: "none",
      });
      toast.success(t("referral_availability_deleted"));
    },
  });

  return (
    <Dialog
      open={canManage}
      onOpenChange={(open) => {
        if (!open && !deletion.isPending) onClose();
      }}
    >
      <DialogContent className="careui border-cui-border bg-cui-background text-cui-foreground">
        <DialogHeader>
          <DialogTitle>{t("referral_delete_availability")}</DialogTitle>
          <DialogDescription className="text-cui-muted-foreground">
            {t("referral_delete_availability_description", {
              name: availability.name,
            })}
          </DialogDescription>
        </DialogHeader>
        {deletion.isError && (
          <p role="alert" className="text-sm text-cui-destructive">
            {t(
              deletion.error instanceof HTTPError &&
                deletion.error.status === 403
                ? "referral_availability_delete_denied"
                : "referral_availability_delete_failed",
            )}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deletion.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (canManage && !deletion.isPending) deletion.mutate();
            }}
            disabled={!canManage || deletion.isPending}
          >
            {deletion.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            {t("referral_delete_availability")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
