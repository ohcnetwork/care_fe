import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { FacilityModel } from "@/components/Facility/models";

import useFilters from "@/hooks/useFilters";

import { CarePatientTokenKey } from "@/common/constants";
import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { TokenData } from "@/types/auth/otpToken";

import { FacilityCard } from "./components/FacilityCard";

export function FacilitiesPage() {
  const { mainLogo } = careConfig;
  const { qParams, updateQuery, advancedFilter, clearSearch, Pagination } =
    useFilters({
      limit: RESULTS_PER_PAGE_LIMIT,
    });

  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(CarePatientTokenKey) || "{}",
  );

  const { t } = useTranslation();

  const { data: facilitiesResponse, isLoading } = useQuery<
    PaginatedResponse<FacilityModel>
  >({
    queryKey: ["facilities", qParams],
    queryFn: query(routes.getAllFacilities, {
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

  const GetLoginHeader = () => {
    if (
      tokenData &&
      dayjs(tokenData.createdAt).isAfter(dayjs().subtract(14, "minutes"))
    ) {
      return (
        <header className="w-full p-4">
          <div className="flex justify-end items-center">
            <Button
              variant="ghost"
              className="text-sm font-medium hover:bg-gray-100 rounded-full px-6"
              onClick={() => navigate("/patient/home")}
            >
              Patient Dashboard
            </Button>
          </div>
        </header>
      );
    }
    return (
      <header className="w-full p-4">
        <div className="flex justify-end items-center">
          <Button
            variant="ghost"
            className="text-sm font-medium hover:bg-gray-100 rounded-full px-6"
            onClick={() => navigate("/login")}
          >
            Sign in
          </Button>
        </div>
      </header>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between w-full">
        <Link href="/" className="mb-6">
          <div className="mb-8">
            <img src={mainLogo?.dark} alt="Care Logo" className="h-12 w-auto" />
          </div>
        </Link>
        <GetLoginHeader />
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
