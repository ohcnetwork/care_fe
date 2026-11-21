import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import CareIcon from "@/CAREUI/icons/CareIcon";
import query from "@/Utils/request/query";
import { ServiceCard } from "@/pages/Facility/settings/healthcareService/ServiceCard";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

export default function FacilityServicesPage({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["healthcareServices", qParams],
    queryFn: query.debounced(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        name: qParams.search,
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
        <div className="relative w-full md:w-auto mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <CareIcon icon="l-search" className="size-5" />
          </span>
          <Input
            placeholder={t("search_healthcare_services")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full md:w-75 pl-10"
            aria-label={t("search_healthcare_services")}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <CardListSkeleton count={4} />
          </div>
        ) : healthcareServices.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon icon="l-folder-open" className="text-primary size-6" />
            }
            title={t("no_services_found")}
            description={""}
          />
        ) : (
          <div className="space-y-2">
            {healthcareServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                link={`/facility/${facilityId}/services/${service.id}/locations`}
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
