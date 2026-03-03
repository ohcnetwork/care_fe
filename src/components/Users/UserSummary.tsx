import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { developerModeAtom } from "@/atoms/developerMode";

import LanguageSelector from "@/components/Common/LanguageSelector";
import UserColumns, { userChildProps } from "@/components/Common/UserColumns";
import ServiceTokenSection from "@/components/Users/ServiceTokenSection";
import { TwoFactorAuth } from "@/components/Users/TwoFactorAuth";
import UserAvatar from "@/components/Users/UserAvatar";
import UserDeleteDialog from "@/components/Users/UserDeleteDialog";
import UserResetPassword from "@/components/Users/UserResetPassword";
import UserSoftwareUpdate from "@/components/Users/UserSoftwareUpdate";
import {
  BasicInfoDetails,
  ContactInfoDetails,
  GeoOrgDetails,
} from "@/components/Users/UserViewDetails";

import useAuthUser from "@/hooks/useAuthUser";

import EditUserSheet from "@/pages/Organization/components/EditUserSheet";

export default function UserSummaryTab({
  userData,
  permissions,
}: userChildProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const [showEditUserSheet, setShowEditUserSheet] = useState(false);

  if (!userData) {
    return <></>;
  }

  const userColumnsData = {
    userData,
    username: userData.username,
    permissions,
  };
  const isOwnAccount = authUser.username === userData.username;
  const canEditUser = authUser.is_superuser || isOwnAccount;
  const canResetPassword = isOwnAccount;

  const renderBasicInformation = () => {
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow-sm sm:rounded-lg bg-white">
        <BasicInfoDetails user={userData} />
      </div>
    );
  };

  const renderContactInformation = () => {
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow-sm sm:rounded-lg bg-white">
        <ContactInfoDetails user={userData} />
      </div>
    );
  };

  const renderGeoOrgDetails = () => {
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow-sm sm:rounded-lg bg-white">
        <GeoOrgDetails user={userData} />
      </div>
    );
  };

  return (
    <>
      <EditUserSheet
        existingUsername={userData.username}
        open={showEditUserSheet}
        setOpen={setShowEditUserSheet}
      />
      <div className="mt-10 flex flex-col gap-y-6">
        {canEditUser && (
          <Button
            variant="outline"
            className="w-fit self-end"
            onClick={() => setShowEditUserSheet(true)}
          >
            <CareIcon icon="l-pen" className="mr-2 size-4" />
            {t("edit_user")}
          </Button>
        )}
        {userData.is_service_account &&
          userData.created_by?.username === authUser.username && (
            <UserColumns
              heading={t("manage_token")}
              note={t("manage_service_account_token_for", {
                username: userData.username,
              })}
              Child={() => <ServiceTokenSection userData={userData} />}
              childProps={userColumnsData}
            />
          )}
        {canEditUser && (
          <UserColumns
            heading={t("edit_avatar")}
            note={
              authUser.username === userData.username
                ? t("edit_avatar_note_self")
                : t("edit_avatar_note")
            }
            Child={UserAvatar}
            childProps={userColumnsData}
          />
        )}
        <UserColumns
          heading={t("personal_information")}
          note={
            authUser.username === userData.username
              ? t("personal_information_note_self")
              : canEditUser
                ? t("personal_information_note")
                : t("personal_information_note_view")
          }
          Child={renderBasicInformation}
          childProps={userColumnsData}
        />
        <UserColumns
          heading={t("contact_info")}
          note={
            authUser.username === userData.username
              ? t("contact_info_note_self")
              : canEditUser
                ? t("contact_info_note")
                : t("contact_info_note_view")
          }
          Child={renderContactInformation}
          childProps={userColumnsData}
        />
        {"geo_organization" in userData && (
          <UserColumns
            heading={t("location_info")}
            note={
              authUser.username === userData.username
                ? t("location_info_note_self")
                : canEditUser
                  ? t("location_info_note")
                  : t("location_info_note_view")
            }
            Child={renderGeoOrgDetails}
            childProps={userColumnsData}
          />
        )}
        {canResetPassword && (
          <UserColumns
            heading={t("reset_password")}
            note={t("reset_password_note_self")}
            Child={UserResetPassword}
            childProps={userColumnsData}
          />
        )}
        {authUser.username === userData.username && (
          <>
            <UserColumns
              heading={t("two_factor_authentication")}
              note={t("two_factor_authentication_note")}
              Child={TwoFactorAuth}
              childProps={userColumnsData}
            />
            <UserColumns
              heading={t("language_selection")}
              note={t("set_your_local_language")}
              Child={LanguageSelector}
              childProps={userColumnsData}
            />
            <UserColumns
              heading={t("software_update_cache")}
              note={t("check_for_available_update")}
              Child={UserSoftwareUpdate}
              childProps={userColumnsData}
            />
          </>
        )}
        {authUser.is_superuser && (
          <Card className="border-red-500">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-destructive">
                {t("danger_zone")}
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border p-3 sm:p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">{t("delete_account")}</h3>
                  <p className="text-sm text-gray-700">
                    {t("delete_account_note")}
                  </p>
                </div>
                <UserDeleteDialog user={userData} isOwnAccount={isOwnAccount} />
              </div>
            </CardContent>
          </Card>
        )}
        {authUser.username === userData.username && <DeveloperModeSection />}
      </div>
    </>
  );
}

function DeveloperModeSection() {
  const { t } = useTranslation();
  const [developerMode, setDeveloperMode] = useAtom(developerModeAtom);

  return (
    <Card className="border-amber-500">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-amber-600">{t("developer_mode")}</CardTitle>
      </CardHeader>
      <CardContent className="gap-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border p-3 sm:p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              {t("production_environment_warning")}
            </h3>
            <p className="text-sm text-gray-700">
              {t("production_environment_warning_description")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="developer-mode"
              checked={developerMode}
              onCheckedChange={setDeveloperMode}
            />
            <Label htmlFor="developer-mode" className="sr-only">
              {t("developer_mode")}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
