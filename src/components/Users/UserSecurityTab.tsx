import { KeyRound, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Muted, SectionTitle } from "@/components/ui/typography";

import { userChildProps } from "@/components/Common/UserColumns";
import { TwoFactorAuth } from "@/components/Users/TwoFactorAuth";
import UserDeleteDialog from "@/components/Users/UserDeleteDialog";
import { UserProfileSection } from "@/components/Users/UserProfileSection";
import UserResetPassword from "@/components/Users/UserResetPassword";
import useAuthUser from "@/hooks/useAuthUser";

export default function UserSecurityTab(props: userChildProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const isOwnAccount = authUser.username === props.userData.username;
  const canManageCredentials =
    isOwnAccount && !props.userData.is_service_account;

  return (
    <div className="max-w-3xl space-y-8 py-6">
      <div className="space-y-1.5">
        <SectionTitle>{t("USERMANAGEMENT_TAB__SECURITY")}</SectionTitle>
        {canManageCredentials && (
          <Muted>{t("profile_security_description")}</Muted>
        )}
      </div>
      {canManageCredentials && (
        <>
          <UserProfileSection
            title={t("update_password")}
            description={t("reset_password_note_self")}
            icon={KeyRound}
          >
            <UserResetPassword userData={props.userData} />
          </UserProfileSection>
          <TwoFactorAuth {...props} />
        </>
      )}
      {authUser.is_superuser && (
        <UserProfileSection
          title={t("delete_account")}
          description={t("delete_account_note")}
          icon={Trash2}
        >
          <UserDeleteDialog
            user={props.userData}
            isOwnAccount={isOwnAccount}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 aria-hidden="true" />
                {t("delete_account")}
              </Button>
            }
          />
        </UserProfileSection>
      )}
    </div>
  );
}
