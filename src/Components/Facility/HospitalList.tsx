import {
  downloadFacility,
  downloadFacilityCapacity,
  downloadFacilityDoctors,
  downloadFacilityTriage,
  getDistrict,
  getLocalBody,
  getPermittedFacilities,
  getState,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { lazy, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const dispatchAction: any = useDispatch();
  const [data, setData] = useState<Array<FacilityModel>>([]);
  let manageFacilities: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [stateName, setStateName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [localbodyName, setLocalbodyName] = useState("");
  const { user_type } = useAuthUser();
  const { t } = useTranslation();

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = {
        limit: resultsPerPage,
        page: qParams.page || 1,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        search_text: qParams.search || undefined,
        state: qParams.state,
        district: qParams.district,
        local_body: qParams.local_body,
        facility_type: qParams.facility_type,
        kasp_empanelled: qParams.kasp_empanelled,
      };

      const res = await dispatchAction(getPermittedFacilities(params));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [
      qParams.page,
      qParams.search,
      qParams.state,
      qParams.district,
      qParams.local_body,
      qParams.facility_type,
      qParams.kasp_empanelled,
      dispatchAction,
    ]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const fetchStateName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.state) &&
        (await dispatchAction(getState(qParams.state)));
      if (!status.aborted) {
        setStateName(res?.data?.name);
      }
    },
    [dispatchAction, qParams.state]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchStateName(status);
    },
    [fetchStateName]
  );

  const fetchDistrictName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.district) &&
        (await dispatchAction(getDistrict(qParams.district)));
      if (!status.aborted) {
        setDistrictName(res?.data?.name);
      }
    },
    [dispatchAction, qParams.district]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDistrictName(status);
    },
    [fetchDistrictName]
  );

  const fetchLocalbodyName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.local_body) &&
        (await dispatchAction(getLocalBody({ id: qParams.local_body })));
      if (!status.aborted) {
        setLocalbodyName(res?.data?.name);
      }
    },
    [dispatchAction, qParams.local_body]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchLocalbodyName(status);
    },
    [fetchLocalbodyName]
  );

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
