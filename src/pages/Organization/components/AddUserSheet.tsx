import { t } from "i18next";

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

import CreateUserForm from "@/components/Users/CreateUserForm";

import { UserBase } from "@/types/user/user";

interface AddUserSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onUserCreated?: (user: UserBase) => void;
}

export default function AddUserSheet({
  open,
  setOpen,
  onUserCreated,
}: AddUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <CareIcon icon="l-user-plus" className="mr-2 h-5 w-5" />
          {t("add_user")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("add_new_user")}</SheetTitle>
          <SheetDescription>
            {t("create_new_user_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CreateUserForm
            onSubmitSuccess={(user) => {
              setOpen(false);
              onUserCreated?.(user);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
