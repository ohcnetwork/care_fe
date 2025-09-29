import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";

import CriticalActionConfirmationDialog from "@/components/Common/CriticalActionConfirmationDialog";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import facilityApi from "@/types/facility/facilityApi";

interface FacilityDeleteDialogProps {
  facility: {
    id?: string;
    name?: string;
  };
  trigger?: React.ReactNode;
}

const FacilityDeleteDialog = ({
  facility,
  trigger,
}: FacilityDeleteDialogProps) => {
  const { t } = useTranslation();
  const { goBack, history } = useAppHistory();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);

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

      if (history.length > 1) {
        const prevPath = history[1];
        if (prevPath.startsWith("/facility/")) {
          navigate("/");
        } else {
          goBack("/");
        }
      } else {
        navigate("/");
      }
    },
    onError: () => {
      setOpen(false);
    },
  });

  const defaultTrigger = (
    <button className={buttonVariants({ variant: "destructive", size: "sm" })}>
      <Trash2Icon className="mr-2 size-4" />
      {t("delete_facility")}
    </button>
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
      trigger={trigger ?? defaultTrigger}
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
