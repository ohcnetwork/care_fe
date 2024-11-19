import careConfig from "@careConfig";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Avatar } from "@/components/Common/Avatar";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import UserAddEditForm from "@/components/Users/UserAddEditForm";

import useAuthUser from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import { editUserPermissions, showAvatarEdit } from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatDisplayName, sleep } from "@/Utils/utils";

import { UserViewDetails } from "./UserViewDetails";

export default function UserInformation({ username }: { username: string }) {
  const { t } = useTranslation();
  const [editAvatar, setEditAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const authUser = useAuthUser();

  const {
    data: userData,
    loading: isLoading,
    refetch: refetchUserData,
  } = useQuery(routes.getUserDetails, {
    pathParams: {
      username: username,
    },
  });

  if (isLoading || !userData) {
    return <Loading />;
  }

  const handleAvatarUpload = async (file: File, onError: () => void) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    const url = `${careConfig.apiUrl}/api/v1/users/${userData.username}/profile_picture/`;

    uploadFile(
      url,
      formData,
      "POST",
      {
        Authorization:
          "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken),
      },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          await sleep(1000);
          refetchUserData();
          Notification.Success({ msg: "Profile picture updated." });
          setEditAvatar(false);
        }
      },
      null,
      () => {
        onError();
      },
    );
  };

  const handleAvatarDelete = async (onError: () => void) => {
    const { res } = await request(routes.deleteProfilePicture, {
      pathParams: { username },
    });
    if (res?.ok) {
      Notification.Success({ msg: "Profile picture deleted" });
      await refetchUserData();
      setEditAvatar(false);
    } else {
      onError();
    }
  };

  const avatarPermissions = showAvatarEdit(authUser, userData);
  const editPermissions = editUserPermissions(authUser, userData);

  const editButton = (
    <div className="flex justify-end">
      <ButtonV2
        onClick={() => setIsEditing(!isEditing)}
        type="button"
        id="toggle-edit-mode-button"
        className="flex items-center gap-2 rounded-sm border border-gray-100 bg-white px-3 py-1.5 text-sm text-[#009D48] shadow-sm hover:bg-gray-50"
        shadow={false}
      >
        <CareIcon icon="l-edit" className="h-4 w-4" />

        {isEditing ? t("view_user_profile") : t("edit_user_profile")}
      </ButtonV2>
    </div>
  );

  return (
    <>
      <AvatarEditModal
        title={t("edit_avatar")}
        open={editAvatar}
        imageUrl={userData?.read_profile_picture_url}
        handleUpload={handleAvatarUpload}
        handleDelete={handleAvatarDelete}
        onClose={() => setEditAvatar(false)}
      />
      {editPermissions && (
        <div>
          {avatarPermissions && (
            <div className="my-4 overflow-visible rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6 flex justify-between">
              <div className="flex items-center">
                <Avatar
                  imageUrl={userData?.read_profile_picture_url}
                  name={formatDisplayName(userData)}
                  className="h-20 w-20"
                />
                <div className="my-4 ml-4 flex flex-col gap-2">
                  <ButtonV2
                    onClick={(_) => setEditAvatar(!editAvatar)}
                    type="button"
                    id="edit-cancel-profile-button"
                    className="border border-gray-200 bg-gray-50 text-black hover:bg-gray-100"
                    shadow={false}
                    disabled={!showAvatarEdit(authUser, userData)}
                    tooltip={
                      !showAvatarEdit(authUser, userData)
                        ? t("edit_avatar_permission_error")
                        : undefined
                    }
                  >
                    {t("change_avatar")}
                  </ButtonV2>
                  <p className="text-xs leading-5 text-gray-500">
                    {t("change_avatar_note")}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div
            id="user-edit-form"
            className={classNames(
              "overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white",
            )}
          >
            {isEditing ? (
              <>
                {editButton}
                <UserAddEditForm
                  username={username}
                  onSubmitSuccess={() => setIsEditing(false)}
                />
              </>
            ) : (
              <>
                {editButton}
                <UserViewDetails user={userData} />
              </>
            )}
          </div>
        </div>
      )}
      {!editPermissions && <UserViewDetails user={userData} />}
    </>
  );
}
