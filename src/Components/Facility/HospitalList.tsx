import {
  downloadFacility,
  downloadFacilityCapacity,
  downloadFacilityDoctors,
  downloadFacilityTriage,
} from "../../Redux/actions";
import { lazy, useEffect, useState } from "react";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CountBlock from "../../CAREUI/display/Count";
import ExportMenu from "../Common/Export";
import { FACILITY_TYPES } from "../../Common/constants";
import { FacilityCard } from "./FacilityCard";
import FacilityFilter from "./FacilityFilter";
import { FacilityModel } from "./models";
import Page from "../Common/components/Page";
import SearchInput from "../Form/SearchInput";

import { navigate } from "raviger";
import useFilters from "../../Common/hooks/useFilters";
import { useTranslation } from "react-i18next";
import useAuthUser from "../../Common/hooks/useAuthUser";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

const Loading = lazy(() => import("../Common/Loading"));

export const HospitalList = () => {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({
    limit: 14,
  });
  const [data, setData] = useState<Array<FacilityModel>>([]);
  let manageFacilities: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [stateName, setStateName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [localbodyName, setLocalbodyName] = useState("");
  const { user_type } = useAuthUser();
  const { t } = useTranslation();

  const {
    res: permittedDataRes,
    data: permittedData,
    refetch: permittedFacilitiesFetch,
  } = useQuery(routes.getPermittedFacilities, {
    query: {
      district: qParams.district,
      district_name: districtName,
      facility_type: qParams.facility_type,
      kasp_empanelled: qParams.kasp_empanelled,
      limit: resultsPerPage,
      local_body: qParams.local_body,
      local_body_name: localbodyName,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
      search_text: qParams.search || undefined,
      state: qParams.state,
      state_name: stateName,
    },
  });

  useEffect(() => {
    setIsLoading(true);
    if (permittedDataRes?.ok && permittedData) {
      const transformedData = permittedData.results.map((result) => ({
        id: Number(result.id),
        name: result.name,
        district: result.district,
        read_cover_image_url: result.read_cover_image_url,
        facility_type: String(result.facility_type),
        address: result.address,
        features: result.features,
        location: {
          latitude: Number(result.latitude),
          longitude: Number(result.longitude),
        },
        oxygen_capacity: result.oxygen_capacity,
        phone_number: result.phone_number,
        type_b_cylinders: result.type_b_cylinders,
        type_c_cylinders: result.type_c_cylinders,
        type_d_cylinders: result.type_d_cylinders,
        middleware_address: result.middleware_address,
        expected_type_b_cylinders: result.expected_type_b_cylinders,
        expected_type_c_cylinders: result.expected_type_c_cylinders,
        expected_type_d_cylinders: result.expected_type_d_cylinders,
        expected_oxygen_requirement: result.expected_oxygen_requirement,
        local_body_object: result.local_body_object,
        district_object: result.district_object,
        state_object: result.state_object,
        ward_object: result.ward_object,
        modified_date: result.modified_date,
        created_date: result.created_date,
      }));

      setData(transformedData);
      setTotalCount(permittedData.count);
    }
    setIsLoading(false);
  }, [
    qParams.page,
    qParams.search,
    qParams.state,
    qParams.district,
    qParams.local_body,
    qParams.facility_type,
    qParams.kasp_empanelled,
    permittedDataRes,
    permittedData,
  ]);

  useEffect(() => {
    permittedFacilitiesFetch();
  }, [permittedFacilitiesFetch]);

  useQuery(routes.getState, {
    pathParams: {
      id: qParams.state,
    },
    prefetch: qParams.state !== undefined,
    onResponse: ({ res, data }) => {
      if (res?.ok && data) {
        setStateName(data.name);
      }
    },
  });

  useQuery(routes.getDistrict, {
    pathParams: {
      id: qParams.district,
    },
    prefetch: qParams.district !== undefined,
    onResponse: ({ res, data }) => {
      if (res?.ok && data) {
        setDistrictName(data.name);
      }
    },
  });

  useQuery(routes.getLocalBody, {
    pathParams: {
      id: qParams.local_body,
    },
    prefetch: qParams.local_body !== undefined,
    onResponse: ({ res, data }) => {
      if (res?.ok && data) {
        setLocalbodyName(data.name);
      }
    },
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
  if (data && data.length) {
    facilityList = data.map((facility: FacilityModel) => (
      <FacilityCard
        key={facility.id!}
        facility={facility}
        userType={user_type}
      />
    ));
  }

  if (isLoading || !data) {
    manageFacilities = <Loading />;
  } else if (data && data.length) {
    manageFacilities = (
      <>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {facilityList}
        </div>
        <Pagination totalCount={totalCount} />
      </>
    );
  } else if (data && data.length === 0) {
    manageFacilities = hasFiltersApplied(qParams) ? (
      <div className="w-full rounded-lg bg-white p-3">
        <div className="mt-4 flex w-full  justify-center text-2xl font-bold text-gray-600">
          {t("no_facilities")}
        </div>
      </div>
    ) : (
      <div>
        <div
          className="border-grey-500 mt-4 cursor-pointer whitespace-nowrap rounded-md border bg-white p-16 text-center text-sm font-semibold shadow hover:bg-gray-300"
          onClick={() => navigate("/facility/create")}
        >
          <i className="fas fa-plus text-3xl"></i>
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
      title={t("Facilities")}
      breadcrumbs={false}
      hideBack
      options={
        <ExportMenu
          exportItems={[
            {
              label: "Facilities",
              action: downloadFacility,
              filePrefix: "facilities",
            },
            {
              label: "Capacities",
              action: downloadFacilityCapacity,
              filePrefix: "capacities",
            },
            {
              label: "Doctors",
              action: downloadFacilityDoctors,
              filePrefix: "doctors",
            },
            {
              label: "Triages",
              action: downloadFacilityTriage,
              filePrefix: "triages",
            },
          ]}
        />
      }
    >
      <div className="mt-4 gap-2 lg:flex">
        <CountBlock
          text="Total Facilities"
          count={totalCount}
          loading={isLoading}
          icon="l-hospital"
          className="flex-1"
        />
        <div className="my-4 flex grow flex-col justify-between gap-2 sm:flex-row">
          <SearchInput
            name="search"
            value={qParams.search}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("facility_search_placeholder")}
          />
          <AdvancedFilterButton onClick={() => advancedFilter.setShow(true)} />
        </div>
      </div>

      <FacilityFilter {...advancedFilter} key={window.location.search} />
      <FilterBadges
        badges={({ badge, value, kasp }) => [
          badge("Facility/District Name", "search"),
          value("State", "state", stateName),
          value("District", "district", districtName),
          value("Local Body", "local_body", localbodyName),
          value(
            "Facility type",
            "facility_type",
            findFacilityTypeById(qParams.facility_type) || ""
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
