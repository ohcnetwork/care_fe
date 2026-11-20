import { Building2, Clock3, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CareUIPageTitle } from "@/components/ui/typography";
import UserAvatar from "@/components/Users/UserAvatar";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";
import { UserRead } from "@/types/user/user";
import { formatDateTime, formatName } from "@/Utils/utils";

interface UserBannerProps {
  userData: UserRead;
  onEdit?: () => void;
}

export default function UserBanner({ userData, onEdit }: UserBannerProps) {
  const { t } = useTranslation();
  const primaryMembership = userData.role_orgs?.[0];

  return (
    <header className="py-5 sm:py-6">
      <div className="flex items-start gap-4 sm:items-center sm:gap-5">
        <UserAvatar username={userData.username} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <CareUIPageTitle id="users-name" className="break-words">
              {formatName(userData) || userData.username}
            </CareUIPageTitle>
            <UserStatusIndicator user={userData} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-soft-foreground">
            <span className="inline-flex min-w-0 font-mono text-xs">
              <span aria-hidden="true">@</span>
              <span id="username" className="break-all">
                {userData.username}
              </span>
            </span>
            {userData.is_service_account && (
              <Badge variant="secondary">{t("profile_service_account")}</Badge>
            )}
          </div>
          {primaryMembership && (
            <p className="flex items-start gap-1.5 text-sm text-soft-foreground">
              <Building2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="break-words">
                {primaryMembership.role.name}
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                {primaryMembership.organization.name}
              </span>
            </p>
          )}
        </div>
        {onEdit && (
          <Button
            onClick={onEdit}
            variant="primary"
            className="hidden shrink-0 gap-2 sm:inline-flex"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {t("edit_user")}
          </Button>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:ml-[6.25rem]">
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-soft-foreground">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {t("profile_last_login")}
            {": "}
            {userData.last_login
              ? formatDateTime(userData.last_login)
              : t("profile_never_logged_in")}
          </span>
        </p>
        {onEdit && (
          <Button
            onClick={onEdit}
            variant="primary"
            className="w-full gap-2 sm:hidden"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {t("edit_user")}
          </Button>
        )}
      </div>
    </header>
  );
}
