import careConfig from "@careConfig";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Common/Avatar";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";

import useAuthUser from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import { showAvatarEdit } from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDisplayName, sleep } from "@/Utils/utils";

export default function UserAvatar({ username }: { username: string }) {
  const { t } = useTranslation();
  const [editAvatar, setEditAvatar] = useState(false);
  const authUser = useAuthUser();

  const {
    data: userData,
    loading: isLoading,
    refetch: refetchUserData,
  } = useTanStackQueryInstead(routes.getUserDetails, {
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
          Notification.Success({ msg: t("avatar_updated_success") });
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
      <div>
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
                id="change-avatar"
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
      </div>
    </>
  );
}
