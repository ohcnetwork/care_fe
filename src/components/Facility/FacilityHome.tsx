import careConfig from "@careConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import AvatarEditModal from "@/components/Common/AvatarEditModal";
import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { FacilitySettingsOverview } from "@/pages/Facility/settings/general/FacilitySettingsOverview";
import facilityApi from "@/types/facility/facilityApi";

import { FacilityHomeActions } from "./FacilityHomeActions";
import { FacilityHomeOverview } from "./FacilityHomeOverview";

interface FacilityHomeProps {
  facilityId: string;
  appearance?: "default" | "settings";
  renderSettingsActions?: (disabled: boolean) => ReactNode;
}

const settingsButtonClassName =
  "h-12 border-neutral-400 text-sm text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10 [&_svg]:size-5";

export const FacilityHome = ({
  facilityId,
  appearance = "default",
  renderSettingsActions,
}: FacilityHomeProps) => {
  const isSettings = appearance === "settings";
  const { t } = useTranslation();
  const user = useAuthUser();
  const [editCoverImage, setEditCoverImage] = useState(false);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const {
    data: facilityData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const { canUpdateFacility } = getPermissions(
    hasPermission,
    facilityData?.root_org_permissions ?? [],
  );
  const { mutateAsync: deleteAvatar } = useMutation({
    mutationFn: mutate(facilityApi.deleteCoverImage, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("cover_image_deleted"));
      queryClient.invalidateQueries({
        queryKey: ["facility", facilityId],
      });
      setEditCoverImage(false);
    },
  });

  const { mutateAsync: uploadCoverImage } = useMutation({
    mutationFn: mutate(facilityApi.uploadCoverImage, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      setEditCoverImage(false);
      queryClient.invalidateQueries({
        queryKey: ["facility", facilityId],
      });
      toast.success(t("cover_image_updated"));
    },
  });

  const handleCoverImageUpload = async (
    file: File,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    try {
      const formData = new FormData();
      formData.append("cover_image", file);
      await uploadCoverImage(formData);
      onSuccess();
    } catch {
      onError();
    }
  };
  const handleCoverImageDelete = async (
    onSuccess: () => void,
    onError: () => void,
  ) => {
    try {
      await deleteAvatar();
      onSuccess();
    } catch {
      onError();
    }
  };

  if (isLoading) {
    return isSettings ? (
      <div role="status" className="space-y-6">
        <span className="sr-only">{t("loading")}</span>
        <div className="flex items-center gap-4 border-b border-neutral-200 pb-6">
          <Skeleton className="size-16 rounded-[10px]" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 max-w-[60vw]" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-64 rounded-[10px]" />
          <Skeleton className="h-48 rounded-[10px]" />
        </div>
      </div>
    ) : (
      <Loading />
    );
  }

  const facilityError = (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle />
      <AlertDescription>
        <p>
          {t(facilityData ? "facility_refresh_error" : "facility_load_error")}
        </p>
        <Button
          variant="outline"
          className={cn("mt-3", settingsButtonClassName)}
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {t("try_again")}
        </Button>
      </AlertDescription>
    </Alert>
  );

  if (isSettings && !facilityData) {
    return facilityError;
  }

  const coverImageHint = (
    <>
      {t("max_size_for_image_uploaded_should_be", {
        maxSize: `${careConfig.imageUploadMaxSizeInMB}MB`,
      })}
      <br />
      {t("allowed_formats_are", { formats: "jpg, png, jpeg" })}{" "}
      {t("recommended_aspect_ratio_for", { aspectRatio: "16:9" })}
    </>
  );

  if (!facilityData) {
    return <ErrorPage />;
  }

  const coverImageDialog = (
    <AvatarEditModal
      title={t("edit_cover_photo")}
      open={editCoverImage}
      imageUrl={facilityData?.read_cover_image_url}
      handleUpload={handleCoverImageUpload}
      handleDelete={handleCoverImageDelete}
      onOpenChange={(open) => setEditCoverImage(open)}
      hint={coverImageHint}
      aspectRatio={16 / 9}
    />
  );
  const facilityActions = canUpdateFacility ? (
    <FacilityHomeActions
      facility={facilityData}
      isSettings={isSettings}
      buttonClassName={isSettings ? settingsButtonClassName : undefined}
      onEditCoverImage={() => setEditCoverImage(true)}
    />
  ) : null;

  if (isSettings) {
    return (
      <>
        {coverImageDialog}
        {isError && facilityError}
        <FacilitySettingsOverview
          facility={facilityData}
          actions={facilityActions}
          settingsActions={renderSettingsActions?.(isError)}
          canDelete={user.is_superuser}
        />
      </>
    );
  }

  return (
    <div>
      {coverImageDialog}
      <FacilityHomeOverview
        facility={facilityData}
        actions={facilityActions}
        canUpdateFacility={canUpdateFacility}
        canDelete={user.is_superuser}
        onEditCoverImage={() => setEditCoverImage(true)}
      />
    </div>
  );
};
