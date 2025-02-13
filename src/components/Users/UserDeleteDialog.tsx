import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

interface ConfirmDialogProps {
  name: string;
  handleCancel: () => void;
  handleOk: () => void;
  show: boolean;
}

const UserDeleteDialog = (props: ConfirmDialogProps) => {
  const { t } = useTranslation();
  return (
    <AlertDialog open={props.show} onOpenChange={props.handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete_user")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("are_you_sure_you_want_to_delete_user")}
            <strong>{props.name}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={props.handleCancel}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={props.handleOk}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserDeleteDialog;
