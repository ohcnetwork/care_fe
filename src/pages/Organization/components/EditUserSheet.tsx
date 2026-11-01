import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import UserForm, { UserProfileEditSection } from "@/components/Users/UserForm";

import { UserReadMinimal } from "@/types/user/user";

interface EditUserSheetProps {
  existingUsername: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  initialSection?: UserProfileEditSection;
  onUserUpdated?: (
    user: UserReadMinimal,
    meta?: { roleOrgIds: string[] },
  ) => void;
}

export default function EditUserSheet({
  existingUsername,
  open,
  setOpen,
  onUserUpdated,
  initialSection,
}: EditUserSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        aria-label={t("edit_user")}
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 px-6 py-5 pr-12">
          <SheetTitle>{t("edit_user")}</SheetTitle>
          <SheetDescription>{t("edit_user_description")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <UserForm
            onSubmitSuccess={(user, meta) => {
              setOpen(false);
              onUserUpdated?.(user, meta);
            }}
            existingUsername={existingUsername}
            initialSection={initialSection}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
