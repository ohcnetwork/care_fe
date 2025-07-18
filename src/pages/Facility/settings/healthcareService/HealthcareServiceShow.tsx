import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

type DuoToneIconName = keyof typeof duoToneIcons;

export default function HealthcareServiceShow({
  facilityId,
  healthcareServiceId,
}: {
  facilityId: string;
  healthcareServiceId: string;
}) {
  const { t } = useTranslation();

  const { data: healthcareService, isLoading } = useQuery({
    queryKey: ["healthcareService", healthcareServiceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: {
        facilityId,
        healthcareServiceId,
      },
    }),
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
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/facility/${facilityId}/settings/healthcare_services`)
              }
            >
              {t("back_to_list")}
            </Button>
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
                    <div
                      key={location.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {location.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/locations/${location.id}/medication_requests`,
                          )
                        }
                      >
                        <CareIcon icon="l-arrow-right" className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
