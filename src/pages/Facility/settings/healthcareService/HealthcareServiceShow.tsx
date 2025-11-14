import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getPermissions } from "@/common/Permissions";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import BackButton from "@/components/Common/BackButton";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import queryClient from "@/Utils/request/queryClient";

type DuoToneIconName = keyof typeof duoToneIcons;

export default function HealthcareServiceShow({
  facilityId,
  healthcareServiceId,
}: {
  facilityId: string;
  healthcareServiceId: string;
}) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canWriteHealthcareService } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const { data: healthcareService, isLoading } = useQuery({
    queryKey: ["healthcareService", healthcareServiceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: {
        facilityId,
        healthcareServiceId,
      },
    }),
  });

  const { mutate: deleteHealthcareService } = useMutation({
    mutationFn: mutate(healthcareServiceApi.deleteHealthcareService, {
      pathParams: {
        facilityId,
        healthcareServiceId,
      },
    }),
    onSuccess: () => {
      queryClient.clear();
      toast.success(t("healthcare_service_deleted_successfully"));
      navigate(`/facility/${facilityId}/settings/healthcare_services`);
    },
  });

  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  if (isLoading) {
    return (
      <Page title={t("healthcare_service_details")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("healthcare_service_details")}
            </h1>
          </div>
          <TableSkeleton count={1} />
        </div>
      </Page>
    );
  }

  if (!healthcareService) {
    return (
      <Page title={t("healthcare_service_details")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("healthcare_service_details")}
            </h1>
          </div>
          <Card>
            <CardContent className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <CareIcon
                  icon="l-folder-open"
                  className="mx-auto mb-2 size-8"
                />
                <p className="text-gray-600">
                  {t("healthcare_service_not_found")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("healthcare_service_details")} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("healthcare_service_details")}
          </h1>
          <div className="flex gap-2">
            <BackButton>{t("back_to_list")}</BackButton>
            {canWriteHealthcareService && (
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setShowDeleteDialog(true)}
              >
                <CareIcon icon="l-trash" className="size-4" />
                {t("delete")}
              </Button>
            )}
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/healthcare_services/${healthcareServiceId}/edit`,
                )
              }
            >
              {t("edit")}
            </Button>
          </div>
          <ConfirmActionDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title={t("are_you_sure")}
            description={t("are_you_sure_want_to_delete_this_service")}
            confirmText={t("confirm")}
            onConfirm={() => deleteHealthcareService()}
          />
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {healthcareService.styling_metadata?.careIcon && (
                  <CareIcon
                    icon={getIconName(
                      healthcareService.styling_metadata.careIcon,
                    )}
                    className="size-6 text-primary"
                  />
                )}
                <div>
                  <CardTitle>{healthcareService.name}</CardTitle>
                  <CardDescription>{t("basic_information")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-500">
                  {t("extra_details")}
                </h3>
                <p className="text-gray-900">
                  {healthcareService.extra_details || t("no_extra_details")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle>{t("locations")}</CardTitle>
              <CardDescription>
                {t("service_available_locations")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthcareService.locations.length === 0 ? (
                <p className="text-gray-500">{t("no_locations_assigned")}</p>
              ) : (
                <div className="grid gap-2">
                  {healthcareService.locations.map((location) => (
                    <Link
                      key={location.id}
                      href={`/facility/${facilityId}/locations/${location.id}/medication_requests`}
                      basePath="/"
                    >
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {location.name}
                          </p>
                        </div>
                        <div className="p-2 flex items-center justify-center">
                          <CareIcon icon="l-arrow-right" className="size-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Managing Organization Section */}
          {!isLoading && healthcareService?.managing_organization && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("managing_organization")}
              </h2>
              <Card className="transition-all duration-200 rounded-md">
                <CardContent className="flex items-start gap-3 py-3 px-4">
                  <div className="shrink-0 relative size-10 rounded-sm flex p-4 items-center justify-center">
                    <ColoredIndicator
                      id={healthcareService.managing_organization.id}
                      className="absolute inset-0 rounded-sm opacity-20"
                    />
                    <CareIcon
                      icon="l-building"
                      className="size-6 relative z-10"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-gray-900 text-base">
                      {healthcareService.managing_organization.name}
                    </h3>
                    {healthcareService.managing_organization.description && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {healthcareService.managing_organization.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <CareIcon icon="l-tag" className="size-3" />
                      <span>{t("organization")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
