import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/Common/Avatar";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
import Loading from "@/components/Common/Loading";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import userApi from "@/types/user/userApi";

export default function UserAvatar({ username }: { username: string }) {
  const { t } = useTranslation();
  const [editAvatar, setEditAvatar] = useState(false);
  const authUser = useAuthUser();
  const queryClient = useQueryClient();
  const canEditAvatar = authUser.is_superuser || authUser.username === username;

  const { mutateAsync: mutateAvatarDelete } = useMutation({
    mutationFn: mutate(userApi.deleteProfilePicture, {
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

  const { mutateAsync: mutateAvatarUpload } = useMutation({
    mutationFn: mutate(userApi.uploadProfilePicture, {
      pathParams: { username },
    }),
    onSuccess: () => {
      setEditAvatar(false);
      queryClient.invalidateQueries({
        queryKey: ["getUserDetails", username],
      });
      if (authUser.username === username) {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
      toast.success(t("avatar_updated_success"));
    },
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["getUserDetails", username],
    queryFn: query(userApi.get, {
      pathParams: { username },
    }),
  });

  if (isLoading || !userData) {
    return <Loading />;
  }

  const handleAvatarUpload = async (
    file: File,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      await mutateAvatarUpload(formData);
      onSuccess();
    } catch {
      onError();
    }
  };

  const handleAvatarDelete = async (
    onSuccess: () => void,
    onError: () => void,
  ) => {
    try {
      await mutateAvatarDelete();
      onSuccess();
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
        onOpenChange={(open) => setEditAvatar(open)}
        aspectRatio={1}
      />
      <div className="relative w-fit shrink-0">
        <Avatar
          name={formatName(userData, true)}
          imageUrl={userData.profile_picture_url}
          colors={["var(--primary-100)", "var(--primary-900)"]}
          className="size-16 rounded-lg sm:size-20"
        />
        {canEditAvatar && (
          <Button
            variant="outline"
            size="icon"
            className="absolute -bottom-1.5 -right-1.5 size-9 bg-background"
            onClick={() => setEditAvatar(true)}
            type="button"
            id="change-avatar"
            aria-label={t("change_avatar")}
          >
            <Camera className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </>
  );
}
