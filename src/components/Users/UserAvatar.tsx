import careConfig from "@careConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
import Loading from "@/components/Common/Loading";

import useAuthUser from "@/hooks/useAuthUser";

import { showAvatarEdit } from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import uploadFile from "@/Utils/request/uploadFile";
import { getAuthorizationHeader } from "@/Utils/request/utils";
import { formatDisplayName, sleep } from "@/Utils/utils";

export default function UserAvatar({ username }: { username: string }) {
  const { t } = useTranslation();
  const [editAvatar, setEditAvatar] = useState(false);
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const { mutate: mutateAvatarDelete } = useMutation({
    mutationFn: mutate(routes.deleteProfilePicture, {
      pathParams: { username },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getUserDetails", username] });
      if (authUser.username === username) {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
      toast.success(t("profile_picture_deleted"));
      setEditAvatar(false);
    },
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["getUserDetails", username],
    queryFn: query(routes.getUserDetails, {
      pathParams: { username },
    }),
  });

  if (isLoading || !userData) {
    return <Loading />;
  }

  const handleAvatarUpload = async (file: File, onError: () => void) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    const url = `${careConfig.apiUrl}/api/v1/users/${userData.username}/profile_picture/`;

    await uploadFile(
      url,
      formData,
      "POST",
      { Authorization: getAuthorizationHeader() },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          await sleep(1000);
          queryClient.invalidateQueries({
            queryKey: ["getUserDetails", username],
          });
          if (authUser.username === username) {
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          }
          toast.success(t("avatar_updated_success"));
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
    try {
      mutateAvatarDelete();
    } catch {
      onError();
    }
  };
  return (
    <>
      <AvatarEditModal
        title={t("edit_avatar")}
        open={editAvatar}
        imageUrl={userData?.profile_picture_url}
        handleUpload={handleAvatarUpload}
        handleDelete={handleAvatarDelete}
        onClose={() => setEditAvatar(false)}
      />
      <div>
        <div className="my-4 overflow-visible rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6 flex justify-between">
          <div className="flex items-center">
            <Avatar
              imageUrl={userData?.profile_picture_url}
              name={formatDisplayName(userData)}
              className="h-20 w-20"
            />
            <div className="my-4 ml-4 flex flex-col gap-2">
              {!showAvatarEdit(authUser, userData) ? (
                <TooltipComponent
                  content={t("edit_avatar_permission_error")}
                  className="w-full"
                >
                  <Button
                    variant="white"
                    onClick={() => setEditAvatar(!editAvatar)}
                    type="button"
                    id="change-avatar"
                    disabled
                  >
                    {t("change_avatar")}
                  </Button>
                </TooltipComponent>
              ) : (
                <Button
                  variant="white"
                  onClick={() => setEditAvatar(!editAvatar)}
                  type="button"
                  id="change-avatar"
                >
                  {t("change_avatar")}
                </Button>
              )}

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
