import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import CriticalActionConfirmationDialog from "@/components/Common/CriticalActionConfirmationDialog";

import facilityApi from "@/types/facility/facilityApi";
import mutate from "@/Utils/request/mutate";
import { goBack } from "@/Utils/utils";

interface FacilityDeleteDialogProps {
  facility: {
    id?: string;
    name?: string;
  };
  trigger?: React.ReactNode;
  /** Control the dialog from outside, e.g. when opened from a menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FacilityDeleteDialog = ({
  facility,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: FacilityDeleteDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const confirmationText = `Delete ${facility.name}`;

  const { mutate: deleteFacility, isPending } = useMutation({
    mutationFn: mutate(facilityApi.delete, {
      pathParams: { facilityId: facility.id || "" },
    }),
    onSuccess: () => {
      toast.success(
        t("facility_deleted_successfully", { name: facility.name }),
      );
      queryClient.invalidateQueries({
        queryKey: ["facilities"],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      queryClient.invalidateQueries({
        queryKey: ["facility", facility.id],
      });

      setOpen(false);
      goBack("/");
    },
    onError: () => {
      setOpen(false);
    },
  });

  const defaultTrigger = (
    <Button variant="destructive" size="sm" type="button">
      <Trash2Icon className="mr-2 size-4" />
      {t("delete_facility")}
    </Button>
  );

  const description = (
    <>
      <p>
        {t("delete_facility_confirmation", {
          name: facility.name,
        })}
      </p>
      <p>
        <Trans
          i18nKey="delete_facility_this_action_is_permanent_and_cannot_be_undone"
          components={{ strong: <strong className="font-semibold" /> }}
        />
      </p>
    </>
  );

  return (
    <CriticalActionConfirmationDialog
      trigger={
        controlledOpen === undefined ? (trigger ?? defaultTrigger) : trigger
      }
      title={t("delete_facility")}
      description={description}
      confirmationText={confirmationText}
      actionButtonText={t("delete_facility")}
      onConfirm={() => deleteFacility()}
      isLoading={isPending}
      open={open}
      onOpenChange={setOpen}
    />
  );
};

export default FacilityDeleteDialog;
