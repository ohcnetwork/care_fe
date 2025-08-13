import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Sheet,
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
  onUserCreated?: (user: UserReadMinimal) => void;
  organizationId?: string;
}

export default function AddUserSheet({
  open,
  setOpen,
  onUserCreated,
  organizationId,
}: AddUserSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" data-cy="add-user-button">
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("add_user")}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-cy="add-user-form"
      >
        <SheetHeader>
          <SheetTitle>{t("add_new_user")}</SheetTitle>
          <SheetDescription>{t("create_user_and_add_to_org")}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <UserForm
            onSubmitSuccess={(user) => {
              setOpen(false);
              onUserCreated?.(user);
            }}
            organizationId={organizationId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
