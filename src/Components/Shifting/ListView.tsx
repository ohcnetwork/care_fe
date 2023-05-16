import {
  completeTransfer,
  downloadShiftRequests,
  listShiftRequests,
} from "../../Redux/actions";
import { useEffect, useState } from "react";

import BadgesList from "./BadgesList";
import ButtonV2 from "../Common/components/ButtonV2";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { ExportButton } from "../Common/Export";
import ListFilter from "./ListFilter";
import Page from "../Common/components/Page";
import SearchInput from "../Form/SearchInput";
import { formatDate } from "../../Utils/utils";
import { formatFilter } from "./Commons";
import loadable from "@loadable/component";
import moment from "moment";
import { navigate } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch, useSelector } from "react-redux";
import useFilters from "../../Common/hooks/useFilters";
import { useTranslation } from "react-i18next";

const Loading = loadable(() => import("../Common/Loading"));

export default function ListView() {
  const dispatch: any = useDispatch();
  const { wartime_shifting } = useConfig();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({});
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
  });
  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;
  const userHomeFacilityId = currentUser.data.home_facility;
  const userType = currentUser.data.user_type;
  const { t } = useTranslation();

  const handleTransferComplete = (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    dispatch(completeTransfer({ externalId: modalFor })).then(() => {
      navigate(
        `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
      );
    });
  };

  const refreshList = () => {
    fetchData();
  };

  const fetchData = () => {
    setIsLoading(true);
    dispatch(
      listShiftRequests(
        formatFilter({
          ...qParams,
          offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        }),
        "shift-list-call"
      )
    ).then((res: any) => {
      if (res && res.data) {
        setData(res.data.results);
        setTotalCount(res.data.count);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [
    qParams.status,
    qParams.facility,
    qParams.orgin_facility,
    qParams.shifting_approving_facility,
    qParams.assigned_facility,
    qParams.emergency,
    qParams.is_up_shift,
    qParams.patient_name,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.modified_date_before,
    qParams.modified_date_after,
    qParams.patient_phone_number,
    qParams.ordering,
    qParams.is_kasp,
    qParams.assigned_to,
    qParams.disease_status,
    qParams.is_antenatal,
    qParams.breathlessness_level,
    qParams.page,
  ]);

  const showShiftingCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="flex flex-1 justify-center text-gray-600 mt-64">
          {t("no_patients_to_show")}
        </div>
      );
    }

    return data.map((shift: any) => (
      <div key={`shift_${shift.id}`} className="w-full mt-6">
        <div className="overflow-hidden shadow rounded-lg bg-white h-full">
          <div
            className={
              "p-4 h-full flex flex-col justify-between " +
              (shift.patient_object.disease_status == "POSITIVE"
                ? "bg-red-50"
                : "")
            }
          >
            <div>
              <div className="flex justify-between">
                <div className="font-bold text-xl capitalize mb-2">
                  {shift.patient_object.name} - {shift.patient_object.age}
                </div>
                <div>
                  {shift.emergency && (
                    <span className="shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">
                      {t("emergency")}
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
                <div className="sm:col-span-1">
                  <dt
                    title={t("shifting_status")}
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-truck mr-2" />
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.status}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title={t("phone_number")}
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-mobile mr-2" />
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.patient_object.phone_number || ""}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title={t("origin_facility")}
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-plane-departure mr-2"></i>
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {(shift.orgin_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                {wartime_shifting && (
                  <div className="sm:col-span-1">
                    <dt
                      title={t("shifting_approving_facility")}
                      className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                    >
                      <i className="fas fa-user-check mr-2"></i>
                      <dd className="font-bold text-sm leading-5 text-gray-900">
                        {(shift.shifting_approving_facility_object || {}).name}
                      </dd>
                    </dt>
                  </div>
                )}
                <div className="sm:col-span-1">
                  <dt
                    title={t("assigned_facility")}
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-plane-arrival mr-2"></i>

                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.assigned_facility_external ||
                        shift.assigned_facility_object?.name ||
                        t("yet_to_be_decided")}
                    </dd>
                  </dt>
                </div>

                <div className="sm:col-span-1">
                  <dt
                    title={t("last_modified")}
                    className={
                      "text-sm leading-5 font-medium flex items-center " +
                      (moment()
                        .subtract(2, "hours")
                        .isBefore(shift.modified_date)
                        ? "text-gray-900"
                        : "rounded p-1 bg-red-400 text-white")
                    }
                  >
                    <i className="fas fa-stopwatch mr-2"></i>
                    <dd className="font-bold text-sm leading-5">
                      {formatDate(shift.modified_date) || "--"}
                    </dd>
                  </dt>
                </div>

                <div className="sm:col-span-1">
                  <dt
                    title={t("patient_address")}
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-home mr-2"></i>
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.patient_object.address || "--"}
                    </dd>
                  </dt>
                </div>
              </dl>
            </div>

            <div className="mt-2 flex">
              <ButtonV2
                onClick={(_) => navigate(`/shifting/${shift.external_id}`)}
                variant="secondary"
                border
                className="w-full"
              >
                <i className="fas fa-eye mr-2" /> {t("all_details")}
              </ButtonV2>
            </div>
            {shift.status === "COMPLETED" && shift.assigned_facility && (
              <div className="mt-2">
                <ButtonV2
                  className="w-full"
                  disabled={
                    !shift.patient_object.allow_transfer ||
                    !(
                      ["DistrictAdmin", "StateAdmin"].includes(userType) ||
                      userHomeFacilityId === shift.assigned_facility
                    )
                  }
                  onClick={() => setModalFor(shift.external_id)}
                >
                  {t("transfer_to_receiving_facility")}
                </ButtonV2>
                <ConfirmDialogV2
                  title={t("confirm_transfer_complete")}
                  description={t("mark_transfer_complete_confirmation")}
                  action="Confirm"
                  show={modalFor === shift.external_id}
                  onClose={() =>
                    setModalFor({ externalId: undefined, loading: false })
                  }
                  onConfirm={() => handleTransferComplete(shift)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Page
      title={t("shifting")}
      hideBack
      componentRight={
        <ExportButton
          action={() =>
            downloadShiftRequests({ ...formatFilter(qParams), csv: 1 })
          }
          filenamePrefix="shift_requests"
        />
      }
      breadcrumbs={false}
      options={
        <>
          <div className="md:px-4">
            <SearchInput
              name="patient_name"
              value={qParams.patient_name}
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              placeholder={t("search_patient")}
            />
          </div>
          <div className="w-32">
            {/* dummy div to align space as per board view */}
          </div>
          <div className="flex md:flex-row flex-col justify-center items-center md:gap-6">
            <div className="my-2 md:my-0">
              <button
                className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-32 md:w-40 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
                onClick={() =>
                  navigate("/shifting/board-view", { query: qParams })
                }
              >
                <i
                  className="fa fa-list mr-1 transform rotate-90"
                  aria-hidden="true"
                ></i>
                {t("board_view")}
              </button>
            </div>
            <div className="flex items-start gap-2">
              <button
                className="flex leading-none border-2 border-gray-200 bg-white rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 focus:text-primary-600 focus:border-gray-400 hover:border-gray-400 rounded-r-full px-4 py-2 text-sm"
                onClick={() => advancedFilter.setShow(true)}
              >
                <i className="fa fa-filter mr-1" aria-hidden="true"></i>
                <span>{t("filters")}</span>
              </button>
            </div>
          </div>
        </>
      }
    >
      <BadgesList {...{ qParams, FilterBadges }} />
      <div>
        {isLoading ? (
          <Loading />
        ) : (
          <div>
            <div className="flex justify-end mt-4 mr-2 -mb-4">
              <button
                className="text-xs hover:text-blue-800"
                onClick={refreshList}
              >
                <i className="fa fa-refresh mr-1" aria-hidden="true"></i>
                {t("refresh_list")}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-x-6 mb-5">
              {showShiftingCardList(data)}
            </div>
            <div>
              <Pagination totalCount={totalCount} />
            </div>
          </div>
        )}
      </div>
      <ListFilter
        showShiftingStatus={true}
        {...advancedFilter}
        key={window.location.search}
      />
    </Page>
  );
}
