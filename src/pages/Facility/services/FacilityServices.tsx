import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { type HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

type DuoToneIconName = keyof typeof duoToneIcons;

function ServiceCard({
  service,
  facilityId,
}: {
  service: HealthcareServiceReadSpec;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  return (
    <Card className="transition-all duration-200 hover:border-primary/50 hover:shadow-sm rounded-md">
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="relative size-10 rounded-sm flex p-4 items-center justify-center">
          <ColoredIndicator
            id={service.id}
            className="absolute inset-0 rounded-sm opacity-20"
          />
          <CareIcon
            icon={
              service.styling_metadata?.careIcon
                ? getIconName(service.styling_metadata.careIcon)
                : "d-health-worker"
            }
            className="size-6 relative z-1"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-gray-900 text-base">
            {service.name}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 truncate">
            {service.extra_details}
          </p>
        </div>
        <Button
          onClick={() =>
            navigate(`/facility/${facilityId}/services/${service.id}`)
          }
          variant="outline"
          size="sm"
          className="px-3 text-xs whitespace-nowrap"
        >
          {t("view_details")}
          <CareIcon icon="l-arrow-right" className="size-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FacilityServicesPage({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["healthcareServices", qParams],
    queryFn: query(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  const healthcareServices = response?.results || [];

  return (
    <Page title={t("services")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("services")}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("discover_healthcare_services")}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <CardListSkeleton count={4} />
          </div>
        ) : healthcareServices.length === 0 ? (
          <EmptyState
            icon="l-folder-open"
            title={t("no_services_found")}
            description={""}
          />
        ) : (
          <div className="space-y-2">
            {healthcareServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                facilityId={facilityId}
              />
            ))}
          </div>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-6 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
