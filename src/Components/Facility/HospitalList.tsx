import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { FACILITY_TYPES } from "../../Common/constants";
import {
  getPermittedFacilities,
  downloadFacility,
  downloadFacilityCapacity,
  downloadFacilityDoctors,
  downloadFacilityTriage,
  getState,
  getDistrict,
  getLocalBody,
} from "../../Redux/actions";
import loadable from "@loadable/component";
import { FacilityModel } from "./models";
import FacilityFilter from "./FacilityFilter";
import { useTranslation } from "react-i18next";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import { FacilityCard } from "./FacilityCard";
import ExportMenu from "../Common/Export";
import CountBlock from "../../CAREUI/display/Count";
import Page from "../Common/components/Page";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";

const Loading = loadable(() => import("../Common/Loading"));

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
  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;
  const userType = currentUser.data.user_type;
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

  let facilityList: any[] = [];
  if (data && data.length) {
    facilityList = data.map((facility: any) => (
      <FacilityCard facility={facility} userType={userType} />
    ));
  }

  if (isLoading || !data) {
    manageFacilities = <Loading />;
  } else if (data && data.length) {
    manageFacilities = (
      <>
        <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
          {facilityList}
        </div>
        <Pagination totalCount={totalCount} />
      </>
    );
  } else if (data && data.length === 0) {
    manageFacilities = hasFiltersApplied(qParams) ? (
      <div className="w-full bg-white rounded-lg p-3">
        <div className="text-2xl mt-4 text-gray-600  font-bold flex justify-center w-full">
          {t("no_facilities")}
        </div>
      </div>
    ) : (
      <div>
        <div
          className="p-16 mt-4 bg-white shadow rounded-md border border-grey-500 whitespace-nowrap text-sm font-semibold cursor-pointer hover:bg-gray-300 text-center"
          onClick={() => navigate("/facility/create")}
        >
          <i className="fas fa-plus text-3xl"></i>
          <div className="mt-2 text-xl">{t("create_facility")}</div>
          <div className="text-xs mt-1 text-red-700">
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
      <div className="lg:flex gap-2 mt-4">
        <CountBlock
          text="Total Facilities"
          count={totalCount}
          loading={isLoading}
          icon={"hospital"}
        />
        <div className="flex my-4 gap-2 flex-col sm:flex-row justify-between flex-grow">
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
