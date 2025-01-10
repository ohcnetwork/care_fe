import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
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

import { FacilityCard } from "./components/FacilityCard";

export function FacilitiesPage() {
  const { mainLogo } = careConfig;
  const { qParams, updateQuery, advancedFilter, clearSearch, Pagination } =
    useFilters({
      limit: RESULTS_PER_PAGE_LIMIT,
    });

  const { t } = useTranslation();

  const { data: facilitiesResponse, isLoading } = useQuery<
    PaginatedResponse<FacilityModel>
  >({
    queryKey: ["facilities", qParams],
    queryFn: query.debounced(routes.getAllFacilities, {
      queryParams: {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between w-full">
        <Link href="/" className="mb-6">
          <div className="mb-8">
            <img src={mainLogo?.dark} alt="Care Logo" className="h-12 w-auto" />
          </div>
        </Link>
        <LoginHeader />
      </div>
      <div className="flex flex-col justify-between sm:flex-row items-center gap-4 mb-6">
        <SearchByMultipleFields
          id="facility-search"
          options={[
            {
              key: "facility_search_text",
              type: "text" as const,
              placeholder: t("facility_search_placeholder_text"),
              value: qParams.name || "",
              shortcutKey: "f",
            },
          ]}
          className="w-full sm:w-1/2"
          onSearch={(key, value) => updateQuery({ name: value })}
          clearSearch={clearSearch}
          enableOptionButtons={false}
        />
      </div>

      <div className="mt-4 flex w-full flex-col gap-4">
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 3xl:grid-cols-3">
              {facilitiesResponse.results.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>

            <div className="flex w-full items-center justify-center">
              <Pagination totalCount={facilitiesResponse.count} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
