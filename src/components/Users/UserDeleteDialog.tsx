import { useMutation } from "@tanstack/react-query";
import { SkullIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";

import CriticalActionConfirmationDialog from "@/components/Common/CriticalActionConfirmationDialog";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import { UserBase } from "@/types/user/user";
import userApi from "@/types/user/userApi";

interface ConfirmDialogProps {
  user: UserBase;
  trigger?: React.ReactNode;
}

const CONFIRMATION_TEXT = "Delete Account";

const UserDeleteDialog = (props: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [open, setOpen] = useState(false);

  const { mutate: deleteUser, isPending } = useMutation({
    mutationFn: mutate(userApi.delete, {
      pathParams: { username: props.user.username || "" },
    }),
    onSuccess: () => {
      toast.success(t("user_deleted_successfully"));
      setOpen(false);
      goBack("/");
    },
    onError: () => {
      setOpen(false);
    },
  });

  return (
    <CriticalActionConfirmationDialog
      trigger={
        props.trigger ?? (
          <button className={buttonVariants({ variant: "destructive" })}>
            <Trash2Icon />
            {t("delete_account")}
          </button>
        )
      }
      title={t("verify_account_deletion_request")}
      description={
        <>
          <p>{t("are_you_sure_you_want_to_delete_this_account")}</p>
          <p>
            <Trans
              i18nKey="delete_account_this_action_is_permanent_and_cannot_be_undone"
              components={{ strong: <strong className="font-semibold" /> }}
            />
          </p>
        </>
      }
      confirmationText={CONFIRMATION_TEXT}
      actionButtonText={t("delete_my_account")}
      onConfirm={() => deleteUser()}
      isLoading={isPending}
      open={open}
      onOpenChange={setOpen}
      icon={<SkullIcon className="size-4 text-red-500" />}
    />
  );
};

export default UserDeleteDialog;
