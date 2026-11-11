import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetBody,
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
        size="lg"
        className="overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>{t("edit_user")}</SheetTitle>
          <SheetDescription>{t("edit_user_description")}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <UserForm
            onSubmitSuccess={(user, meta) => {
              setOpen(false);
              onUserUpdated?.(user, meta);
            }}
            existingUsername={existingUsername}
            initialSection={initialSection}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
