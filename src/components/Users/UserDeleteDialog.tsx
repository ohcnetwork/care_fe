import { useMutation } from "@tanstack/react-query";
import { SkullIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [confirmText, setConfirmText] = useState("");

  const { mutate: deleteUser, isPending } = useMutation({
    mutationFn: mutate(userApi.delete, {
      pathParams: { username: props.user.username || "" },
    }),
    onSuccess: () => {
      toast.success(t("user_deleted_successfully"));
      setOpen(false);
      setConfirmText("");
      goBack("/");
    },
    onError: () => {
      setOpen(false);
      setConfirmText("");
      toast.error(t("user_delete_error"));
    },
  });

  const isConfirmed = confirmText === CONFIRMATION_TEXT;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {props.trigger ? (
        <AlertDialogTrigger asChild>{props.trigger}</AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger
          className={buttonVariants({ variant: "destructive" })}
        >
          <Trash2Icon />
          {t("delete_account")}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 border-b pb-2">
            <div className="bg-red-500/10 p-2 rounded">
              <SkullIcon className="size-4 text-red-500" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("verify_account_deletion_request")}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm text-black">
          <p>{t("are_you_sure_you_want_to_delete_this_account")}</p>
          <p>
            <Trans
              i18nKey="this_action_is_permanent_and_cannot_be_undone"
              components={{ strong: <strong className="font-semibold" /> }}
            />
          </p>
          <div>
            <span>
              <Trans
                i18nKey="account_delete_confirm_input_label"
                components={{
                  code: (
                    <code className="font-mono px-1 py-0.5 bg-gray-100 rounded" />
                  ),
                }}
                values={{ confirmationText: CONFIRMATION_TEXT }}
              />
            </span>
            <Input
              className="mt-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setOpen(false)}
            className="w-full sm:flex-1"
            disabled={isPending}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteUser()}
            disabled={!isConfirmed || isPending}
            className={cn(
              buttonVariants({ variant: "destructive" }),
              "w-full sm:flex-1",
            )}
          >
            {t("delete_my_account")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserDeleteDialog;
