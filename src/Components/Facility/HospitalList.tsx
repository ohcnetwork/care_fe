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
import CircularProgress from "@material-ui/core/CircularProgress";
import { make as SlideOver } from "../Common/SlideOver.gen";
import FacillityFilter from "./FacilityFilter";
import { useTranslation } from "react-i18next";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import { FacilityCard } from "./FacilityCard";
import useExport from "../../Common/hooks/useExport";
import { DropdownItem } from "../Common/components/Menu";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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
  const { exportCSV, ExportMenu } = useExport();
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
    <div className="px-6">
      <div className="flex justify-between items-center">
        <PageTitle title={t("Facilities")} breadcrumbs={false} hideBack />
        <ExportMenu>
          <DropdownItem
            onClick={() => exportCSV("facilities", downloadFacility())}
          >
            Facilities
          </DropdownItem>
          <DropdownItem
            onClick={() => exportCSV("capacities", downloadFacilityCapacity())}
          >
            Capacities
          </DropdownItem>
          <DropdownItem
            onClick={() => exportCSV("doctors", downloadFacilityDoctors())}
          >
            Doctors
          </DropdownItem>
          <DropdownItem
            onClick={() => exportCSV("triages", downloadFacilityTriage())}
          >
            Triages
          </DropdownItem>
        </ExportMenu>
      </div>
      <div className="lg:flex gap-2 mt-4">
        <div className="bg-white overflow-hidden shadow rounded-lg md:mr-2 min-w-fit flex-1">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Facilities
              </dt>
              {/* Show spinner until cound is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <CircularProgress className="text-primary-500" />
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div className="flex my-4 gap-2 flex-col md:flex-row justify-between flex-grow">
          <SearchInput
            name="search"
            value={qParams.search}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("facility_search_placeholder")}
          />

          <div className="flex items-start mb-2 w-full md:w-auto">
            <button
              className="btn btn-primary-ghost w-full md:w-auto"
              onClick={() => advancedFilter.setShow(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fill-current w-4 h-4 mr-2"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12">
                  {" "}
                </line>
                <line x1="8" y1="18" x2="21" y2="18">
                  {" "}
                </line>
                <line x1="3" y1="6" x2="3.01" y2="6">
                  {" "}
                </line>
                <line x1="3" y1="12" x2="3.01" y2="12">
                  {" "}
                </line>
                <line x1="3" y1="18" x2="3.01" y2="18">
                  {" "}
                </line>
              </svg>
              <span>{t("advanced_filters")}</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <SlideOver {...advancedFilter}>
          <div className="bg-white min-h-screen p-4">
            <FacillityFilter {...advancedFilter} />
          </div>
        </SlideOver>
      </div>
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
    </div>
  );
};
