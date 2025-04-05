import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";

import { LoginHeader } from "@/components/Common/LoginHeader";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import OrganizationFilter from "@/pages/Organization/components/OrganizationFilter";
import { FacilityData } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";

import { FacilityCard } from "./components/FacilityCard";

export function FacilitiesPage() {
  const { mainLogo } = careConfig;
  const { qParams, updateQuery, advancedFilter, Pagination } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
  });

  const { t } = useTranslation();
  const [selectedOrg, setSelectedOrg] = useState<string | undefined>(
    qParams.organization,
  );

  useEffect(() => {
    if (selectedOrg) {
      updateQuery({ organization: selectedOrg });
    } else {
      updateQuery({ organization: undefined });
    }
  }, [selectedOrg]);

  const { data: facilitiesResponse, isLoading } = useQuery<
    PaginatedResponse<FacilityData>
  >({
    queryKey: ["facilities", qParams],
    queryFn: query.debounced(facilityApi.getAllFacilities, {
      queryParams: {
        name: qParams.name,
        ...(qParams.facility_type && { facility_type: qParams.facility_type }),
        ...(qParams.organization && {
          organization: qParams.organization,
        }),
        page: qParams.page,
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: (qParams.page - 1) * RESULTS_PER_PAGE_LIMIT,
        ...advancedFilter.filter,
      },
    }),
    enabled: !!qParams.organization,
  });

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-start justify-between w-full">
        <Link href="/" className="">
          <img src={mainLogo?.dark} alt="Care Logo" className="w-auto h-12" />
        </Link>
        <LoginHeader />
      </div>
      <div className="flex flex-col items-start justify-between gap-5 mt-4 xl:flex-row">
        <OrganizationFilter
          skipLevels={[]}
          selected={qParams.organization}
          onChange={(filter) => {
            if ("organization" in filter) {
              if (filter.organization) {
                setSelectedOrg(filter.organization as string);
              } else {
                setSelectedOrg(undefined);
              }
            }
            if ("facility_type" in filter) {
              updateQuery({ facility_type: filter.facility_type });
            }
          }}
          className="flex flex-row w-full"
        />
        <SearchByMultipleFields
          id="facility-search"
          options={[
            {
              key: "facility_search_placeholder_text",
              type: "text" as const,
              placeholder: t("facility_search_placeholder_text"),
              value: qParams.name || "",
            },
          ]}
          initialOptionIndex={0}
          className="w-[calc(100vw-2rem)] sm:max-w-min sm:min-w-64"
          onSearch={(key, value) => updateQuery({ name: value })}
          enableOptionButtons={false}
        />
      </div>

      <div className="flex flex-col w-full gap-4 mt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : !qParams.organization ? (
          <Card className="p-6">
            <div className="text-lg font-medium text-gray-500">
              {t("select_location_first")}
            </div>
          </Card>
        ) : !facilitiesResponse?.results.length ? (
          <Card className="p-6">
            <div className="text-lg font-medium text-gray-500">
              {t("no_facilities_found")}
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 3xl:grid-cols-3">
              {facilitiesResponse.results.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>

            <div className="flex items-center justify-center w-full">
              <Pagination totalCount={facilitiesResponse.count} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
