import { navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ExportMenu from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FacilityCard } from "@/components/Facility/FacilityCard";
import FacilityFilter from "@/components/Facility/FacilityFilter";
import { FacilityModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { FACILITY_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import SearchByMultipleFields from "../Common/SearchByMultipleFields";

export const FacilityList = () => {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
    clearSearch,
  } = useFilters({
    limit: 14,
    cacheBlacklist: ["search"],
  });

  useEffect(() => {
    if (!qParams.state && (qParams.district || qParams.local_body)) {
      advancedFilter.removeFilters(["district", "local_body"]);
    }
    if (!qParams.district && qParams.local_body) {
      advancedFilter.removeFilters(["local_body"]);
    }
  }, [advancedFilter, qParams]);

  let manageFacilities: any = null;
  const { user_type } = useAuthUser();
  const { t } = useTranslation();

  const { data: permittedData, loading: isLoading } = useTanStackQueryInstead(
    routes.getPermittedFacilities,
    {
      query: {
        limit: resultsPerPage,
        page: qParams.page || 1,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        search_text: qParams.search || undefined,
        state: qParams.state,
        district: qParams.district,
        local_body: qParams.local_body,
        facility_type: qParams.facility_type,
        kasp_empanelled: qParams.kasp_empanelled,
      },
    },
  );

  const { data: stateData } = useTanStackQueryInstead(routes.getState, {
    pathParams: {
      id: qParams.state,
    },
    prefetch: qParams.state !== undefined,
  });

  const { data: districtData } = useTanStackQueryInstead(routes.getDistrict, {
    pathParams: {
      id: qParams.district,
    },
    prefetch: qParams.district !== undefined,
  });

  const { data: localBodyData } = useTanStackQueryInstead(routes.getLocalBody, {
    pathParams: {
      id: qParams.local_body,
    },
    prefetch: qParams.local_body !== undefined,
  });

  const findFacilityTypeById = (id: number) => {
    const facility_type = FACILITY_TYPES.find((type) => type.id == id);
    return facility_type?.text;
  };

  const hasFiltersApplied = (qParams: any) => {
    return (
      qParams.state ||
      qParams.district ||
      qParams.local_body ||
      qParams.facility_type ||
      qParams.kasp_empanelled ||
      qParams?.search
    );
  };

  let facilityList: JSX.Element[] = [];
  if (permittedData && permittedData.results.length) {
    facilityList = permittedData.results.map((facility: FacilityModel) => (
      <FacilityCard
        key={facility.id!}
        facility={facility}
        userType={user_type}
      />
    ));
  }

  if (isLoading || !permittedData) {
    manageFacilities = <Loading />;
  } else if (permittedData.results && permittedData.results.length) {
    manageFacilities = (
      <>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {facilityList}
        </div>
        <Pagination totalCount={permittedData.count} />
      </>
    );
  } else if (permittedData.results && permittedData.results.length === 0) {
    manageFacilities = hasFiltersApplied(qParams) ? (
      <div className="w-full rounded-lg bg-white p-3">
        <div className="mt-4 flex w-full justify-center text-2xl font-bold text-secondary-600">
          {t("no_facilities")}
        </div>
      </div>
    ) : (
      <div>
        <div
          className="mt-4 cursor-pointer whitespace-nowrap rounded-md border bg-white p-16 text-center text-sm font-semibold shadow hover:bg-secondary-300"
          onClick={() => navigate("/facility/create")}
        >
          <CareIcon icon="l-plus" className="text-3xl" />
          <div className="mt-2 text-xl">{t("create_facility")}</div>
          <div className="mt-1 text-xs text-red-700">
            {t("no_duplicate_facility")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Page
      title={t("facilities")}
      breadcrumbs={false}
      hideBack
      options={
        <div className="flex items-center gap-2 ">
          <AdvancedFilterButton onClick={() => advancedFilter.setShow(true)} />
          <ExportMenu
            exportItems={[
              {
                label: "Facilities",
                route: routes.downloadFacility,
                filePrefix: "facilities",
              },
              {
                label: "Capacities",
                route: routes.downloadFacilityCapacity,
                filePrefix: "capacities",
              },
              {
                label: "Doctors",
                route: routes.downloadFacilityDoctors,
                filePrefix: "doctors",
              },
              {
                label: "Triages",
                route: routes.downloadFacilityTriage,
                filePrefix: "triages",
              },
            ]}
          />
        </div>
      }
    >
      <div className="mt-4 gap-4 lg:gap-16 flex flex-col lg:flex-row lg:items-center">
        <CountBlock
          text="Total Facilities"
          count={permittedData ? permittedData.count : 0}
          loading={isLoading}
          icon="d-hospital"
          className=""
        />
        <SearchByMultipleFields
          id="facility-search"
          options={[
            {
              key: "facility_district_name",
              label: "Facility or District Name",
              type: "text" as const,
              placeholder: "facility_search_placeholder",
              value: qParams.search || "",
              shortcutKey: "f",
            },
          ]}
          className="w-full"
          onSearch={(key, value) => updateQuery({ search: value })}
          clearSearch={clearSearch}
        />
      </div>

      <FacilityFilter {...advancedFilter} key={window.location.search} />
      <FilterBadges
        badges={({ badge, value, kasp }) => [
          badge("Facility/District Name", "search"),
          value(
            "State",
            "state",
            qParams.state && stateData ? stateData.name : "",
          ),
          value(
            "District",
            "district",
            qParams.district && districtData ? districtData.name : "",
          ),
          value(
            "Local Body",
            "local_body",
            qParams.local_body && localBodyData ? localBodyData.name : "",
          ),
          value(
            "Facility type",
            "facility_type",
            findFacilityTypeById(qParams.facility_type) || "",
          ),
          kasp("Empanelled", "kasp_empanelled"),
        ]}
      />
      <div className="mt-4 pb-4">
        <div>{manageFacilities}</div>
      </div>
    </Page>
  );
};
