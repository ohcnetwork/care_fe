import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import LanguageSelector from "@/components/Common/LanguageSelector";
import userColumns from "@/components/Common/UserColumns";
import UserAvatar from "@/components/Users/UserAvatar";
import UserDeleteDialog from "@/components/Users/UserDeleteDialog";
import {
  UserBasicInfoView,
  UserContactInfoView,
  UserProfessionalInfoView,
} from "@/components/Users/UserEditDetails";
import UserResetPassword from "@/components/Users/UserResetPassword";
import {
  BasicInfoDetails,
  ContactInfoDetails,
  ProfessionalInfoDetails,
} from "@/components/Users/UserViewDetails";
import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import * as Notification from "@/Utils/Notifications";
import {
  editUserPermissions,
  showAvatarEdit,
  showUserDelete,
  showUserPasswordReset,
} from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

export default function UserSummaryTab({
  userData,
  refetchUserData,
}: {
  userData?: UserModel;
  refetchUserData?: () => void;
}) {
  const { t } = useTranslation();
  const [showDeleteDialog, setshowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const authUser = useAuthUser();

  if (!userData) {
    return <></>;
  }

  const handleSubmit = async () => {
    setIsDeleting(true);
    const { res, error } = await request(routes.deleteUser, {
      pathParams: { username: userData.username },
    });
    setIsDeleting(false);
    if (res?.status === 204) {
      Notification.Success({
        msg: t("user_deleted_successfully"),
      });
      setshowDeleteDialog(!showDeleteDialog);
      navigate("/users");
    } else {
      Notification.Error({
        msg: t("user_delete_error") + ": " + (error || ""),
      });
      setshowDeleteDialog(!showDeleteDialog);
    }
  };

  const userColumnsData = {
    userData,
    username: userData.username,
    refetchUserData,
  };
  const deletePermitted = showUserDelete(authUser, userData);
  const passwordResetPermitted = showUserPasswordReset(authUser, userData);
  const avatarPermitted = showAvatarEdit(authUser, userData);
  const editPermissions = editUserPermissions(authUser, userData);

  const renderBasicInformation = () => {
    if (editPermissions) {
      return (
        <UserBasicInfoView
          username={userData.username}
          userData={userData}
          onSubmitSuccess={refetchUserData}
        />
      );
    }
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white">
        <BasicInfoDetails user={userData} />
      </div>
    );
  };

  const renderContactInformation = () => {
    if (editPermissions) {
      return (
        <UserContactInfoView
          username={userData.username}
          userData={userData}
          onSubmitSuccess={refetchUserData}
        />
      );
    }
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white">
        <ContactInfoDetails user={userData} />
      </div>
    );
  };

  const renderProfessionalInformation = () => {
    if (editPermissions) {
      return (
        <UserProfessionalInfoView
          username={userData.username}
          userData={userData}
          onSubmitSuccess={refetchUserData}
        />
      );
    }
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white">
        <ProfessionalInfoDetails user={userData} />
      </div>
    );
  };

  return (
    <>
      {showDeleteDialog && (
        <UserDeleteDialog
          name={userData.username}
          handleOk={handleSubmit}
          handleCancel={() => {
            setshowDeleteDialog(false);
          }}
        />
      )}
      <div className="mt-10 flex flex-col gap-y-6">
        {avatarPermitted &&
          userColumns(
            t("edit_avatar"),
            authUser.username === userData.username
              ? t("edit_avatar_note_self")
              : t("edit_avatar_note"),
            UserAvatar,
            userColumnsData,
          )}
        {userColumns(
          t("personal_information"),
          authUser.username === userData.username
            ? t("personal_information_note_self")
            : editPermissions
              ? t("personal_information_note")
              : t("personal_information_note_view"),
          renderBasicInformation,
          userColumnsData,
        )}
        {userColumns(
          t("contact_info"),
          authUser.username === userData.username
            ? t("contact_info_note_self")
            : editPermissions
              ? t("contact_info_note")
              : t("contact_info_note_view"),
          renderContactInformation,
          userColumnsData,
        )}
        {userColumns(
          t("professional_info"),
          authUser.username === userData.username
            ? t("professional_info_note_self")
            : editPermissions
              ? t("professional_info_note")
              : t("professional_info_note_view"),
          renderProfessionalInformation,
          userColumnsData,
        )}
        {passwordResetPermitted &&
          userColumns(
            t("reset_password"),
            authUser.username === userData.username
              ? t("reset_password_note_self")
              : editPermissions
                ? t("reset_password_note")
                : t("reset_password_note_view"),
            UserResetPassword,
            userColumnsData,
          )}
        {authUser.username === userData.username &&
          userColumns(
            t("language_selection"),
            t("set_your_local_language"),
            LanguageSelector,
            userColumnsData,
          )}
        {deletePermitted && (
          <div className="mt-3 flex flex-col items-center gap-5 border-t-2 pt-5 sm:flex-row">
            <div className="sm:w-1/4">
              <div className="my-1 text-sm leading-5">
                <p className="mb-2 font-semibold">{t("delete_account")}</p>
                <p className="text-secondary-600">{t("delete_account_note")}</p>
              </div>
            </div>
            <div className="w-3/4">
              <ButtonV2
                authorizeFor={() => deletePermitted}
                onClick={() => setshowDeleteDialog(true)}
                variant="danger"
                data-testid="user-delete-button"
                className="my-1 inline-flex"
                disabled={isDeleting}
              >
                <CareIcon icon="l-trash" className="h-4" />
                <span className="">{t("delete_account_btn")}</span>
              </ButtonV2>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
