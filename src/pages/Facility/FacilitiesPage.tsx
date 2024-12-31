import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

const STATE_GEO_ID = careConfig.keralaGeoId;

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
        geo_organization: qParams.geo_organization || STATE_GEO_ID,
        page: qParams.page,
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: (qParams.page - 1) * RESULTS_PER_PAGE_LIMIT,
        ...advancedFilter.filter,
      },
    }),
    enabled: !!qParams.geo_organization || !!STATE_GEO_ID,
  });

  useEffect(() => {
    if (qParams.district) {
      updateQuery({ geo_organization: qParams.district });
    } else {
      updateQuery({ geo_organization: STATE_GEO_ID });
    }
  }, [qParams.district, STATE_GEO_ID]);

  /*   useEffect(() => {
    if (!qParams.district && qParams.local_body) {
      advancedFilter.removeFilters(["local_body"]);
    }
  }, [advancedFilter, qParams]);
 */
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
              key: "facility_district_pincode",
              type: "text" as const,
              placeholder: t("facility_search_placeholder_pincode"),
              value: qParams.search || "",
              shortcutKey: "f",
            },
          ]}
          className="w-full sm:w-1/2"
          onSearch={(key, value) => updateQuery({ search: value })}
          clearSearch={clearSearch}
          enableOptionButtons={false}
        />
        <Button
          variant="white"
          onClick={() => advancedFilter.setShow(true)}
          className="flex items-center gap-2 p-5"
        >
          <CareIcon icon="l-filter" className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">Filter</span>
        </Button>
      </div>
      {/* <FilterBadges
        badges={({ badge, value }) => [
          badge("Facility/District/Pincode", "search"),
          value(
            "District",
            "district",
            qParams.district && districtResponse?.data
              ? districtResponse?.data.name
              : "",
          ),
          value(
            "Local Body",
            "local_body",
            qParams.local_body && localBodyResponse?.data
              ? localBodyResponse?.data.name
              : "",
          ),
          value("Pin Code", "pin_code", qParams.pin_code || ""),
        ]}
      /> */}

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
