import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";
import { LoginHeader } from "@/components/Common/LoginHeader";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { FacilityModel } from "@/components/Facility/models";

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

import OrganizationFilter from "../Organization/components/OrganizationFilter";
import { FacilityCard } from "./components/FacilityCard";

export function FacilitiesPage() {
  const { mainLogo } = careConfig;
  const { qParams, updateQuery, advancedFilter, clearSearch, Pagination } =
    useFilters({
      limit: RESULTS_PER_PAGE_LIMIT,
    });

  const { t } = useTranslation();
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(() => {
    return qParams.organization ? [qParams.organization] : [];
  });

  useEffect(() => {
    if (selectedOrgs.length > 0) {
      const lastSelected = selectedOrgs[selectedOrgs.length - 1];
      updateQuery({ organization: lastSelected });
    } else {
      updateQuery({ organization: undefined });
    }
  }, [selectedOrgs]);

  const { data: facilitiesResponse, isLoading } = useQuery<
    PaginatedResponse<FacilityModel>
  >({
    queryKey: ["facilities", qParams],
    queryFn: query(routes.getAllFacilities, {
      queryParams: {
        name: qParams.search,
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
      <div className="flex flex-col items-start justify-between gap-5 mt-4 sm:flex-row">
        <OrganizationFilter
          skipLevels={[]}
          selected={selectedOrgs}
          onChange={(filter, level) => {
            if ("organization" in filter) {
              if (filter.organization) {
                setSelectedOrgs((prev) => {
                  const newOrgId = filter.organization as string;
                  const newOrgs = prev.slice(0, level);
                  newOrgs.push(newOrgId);
                  return newOrgs;
                });
              } else {
                setSelectedOrgs([]);
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
              value: qParams.search || "",
              shortcutKey: "f",
            },
          ]}
          className="max-w-min sm:min-w-64"
          onSearch={(key, value) => updateQuery({ search: value })}
          clearSearch={clearSearch}
          enableOptionButtons={false}
        />
      </div>

      <div className="flex flex-col w-full gap-4 mt-4">
        {isLoading ? (
          <Loading />
        ) : !facilitiesResponse?.results.length ? (
          <Card className="p-6">
            <div className="text-lg font-medium text-muted-foreground">
              {t("no_facilities_found")}
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 3xl:grid-cols-3">
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
