import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import UserForm from "@/components/Users/UserForm";

import { UserReadMinimal } from "@/types/user/user";

interface EditUserSheetProps {
  existingUsername: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onUserUpdated?: (user: UserReadMinimal) => void;
}

export default function EditUserSheet({
  existingUsername,
  open,
  setOpen,
  onUserUpdated,
}: EditUserSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-cy="add-user-form"
      >
        <SheetHeader>
          <SheetTitle>{t("edit_user")}</SheetTitle>
          <SheetDescription>{t("edit_user_description")}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <UserForm
            onSubmitSuccess={(user) => {
              setOpen(false);
              onUserUpdated?.(user);
            }}
            existingUsername={existingUsername}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
