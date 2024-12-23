import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import FacilityFilter from "@/components/Facility/FacilityFilter";
import {
  DistrictModel,
  FacilityModel,
  LocalBodyModel,
} from "@/components/Facility/models";

import useFilters from "@/hooks/useFilters";

import { CarePatientTokenKey } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { RequestResult } from "@/Utils/request/types";
import { TokenData } from "@/types/auth/otpToken";

import { FacilityCard } from "./components/FacilityCard";

export function FacilitiesPage() {
  const { mainLogo } = careConfig;
  const { qParams, updateQuery, FilterBadges, advancedFilter, clearSearch } =
    useFilters({
      limit: 14,
    });

  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(CarePatientTokenKey) || "{}",
  );

  const { t } = useTranslation();

  const { data: districtResponse } = useQuery<RequestResult<DistrictModel>>({
    queryKey: ["district", qParams.district],
    queryFn: () =>
      request(routes.getDistrict, {
        pathParams: { id: qParams.district || "" },
      }),
    enabled: !!qParams.district,
  });

  const { data: localBodyResponse } = useQuery<RequestResult<LocalBodyModel>>({
    queryKey: ["localBody", qParams.local_body],
    queryFn: () =>
      request(routes.getLocalBody, {
        pathParams: { id: qParams.local_body || "" },
      }),
    enabled: !!qParams.local_body,
  });

  useEffect(() => {
    if (!qParams.district && qParams.local_body) {
      advancedFilter.removeFilters(["local_body"]);
    }
  }, [advancedFilter, qParams]);

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
        <FacilityFilter {...advancedFilter} key={window.location.search} />
      </div>
      <FilterBadges
        badges={({ badge, value, kasp }) => [
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
          kasp("Empanelled", "kasp_empanelled"),
        ]}
      />

      <PaginatedList
        route={routes.getAllFacilities}
        query={{
          search_text: qParams.search,
          state: qParams.state,
          district: qParams.district,
          local_body: qParams.local_body,
        }}
      >
        {() => (
          <div className="mt-4 flex w-full flex-col gap-4">
            <div className="flex flex-col gap-4">
              <PaginatedList.WhenEmpty>
                <Card className="p-6">
                  <div className="text-lg font-medium text-muted-foreground">
                    No facilities found
                  </div>
                </Card>
              </PaginatedList.WhenEmpty>

              <PaginatedList.Items<FacilityModel> className="grid gap-4 grid-cols-1 md:grid-cols-2 3xl:grid-cols-3">
                {(facility) => (
                  <FacilityCard key={facility.id} facility={facility} />
                )}
              </PaginatedList.Items>

              <div className="flex w-full items-center justify-center">
                <PaginatedList.Paginator hideIfSinglePage />
              </div>
            </div>
          </div>
        )}
      </PaginatedList>
    </div>
  );
}
