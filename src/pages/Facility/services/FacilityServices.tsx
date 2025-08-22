import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { ServiceCard } from "@/pages/Facility/settings/healthcareService/ServiceCard";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

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
