import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import UserForm from "@/components/Users/UserForm";

import { UserReadMinimal } from "@/types/user/user";

interface AddUserSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onUserCreated?: (
    user: UserReadMinimal,
    meta?: { roleOrgIds: string[] },
  ) => void;
  organizationId?: string;
  isServiceAccount?: boolean;
}

export default function AddUserSheet({
  open,
  setOpen,
  onUserCreated,
  organizationId,
  isServiceAccount = false,
}: AddUserSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {isServiceAccount ? t("add_service_account") : t("add_user")}
        </Button>
      </SheetTrigger>
      <SheetContent size="lg" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>
            {isServiceAccount
              ? t("add_new_service_account")
              : t("add_new_user")}
          </SheetTitle>
          <SheetDescription>
            {isServiceAccount
              ? t("create_service_account_and_add_to_org")
              : t("create_user_and_add_to_org")}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <UserForm
            onSubmitSuccess={(user, meta) => {
              setOpen(false);
              onUserCreated?.(user, meta);
            }}
            organizationId={organizationId}
            isServiceAccount={isServiceAccount}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
