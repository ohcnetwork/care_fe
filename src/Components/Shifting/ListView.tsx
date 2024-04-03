import { downloadShiftRequests } from "../../Redux/actions";
import { lazy, useState } from "react";

import BadgesList from "./BadgesList";
import ButtonV2 from "../Common/components/ButtonV2";
import ConfirmDialog from "../Common/ConfirmDialog";
import { ExportButton } from "../Common/Export";
import ListFilter from "./ListFilter";
import Page from "../Common/components/Page";
import SearchInput from "../Form/SearchInput";
import { formatAge, formatDateTime } from "../../Utils/utils";
import { formatFilter } from "./Commons";
import { navigate } from "raviger";

import useConfig from "../../Common/hooks/useConfig";

import useFilters from "../../Common/hooks/useFilters";

import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import dayjs from "../../Utils/dayjs";
import useAuthUser from "../../Common/hooks/useAuthUser";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

const Loading = lazy(() => import("../Common/Loading"));

export default function ListView() {
  const { wartime_shifting } = useConfig();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({ cacheBlacklist: ["patient_name"] });

  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
  });
  const authUser = useAuthUser();
  const { t } = useTranslation();

  const handleTransferComplete = async (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    await request(routes.completeTransfer, {
      pathParams: { externalId: shift.external_id },
    });
    navigate(
      `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
    );
  };

  const {
    data: shiftData,
    loading,
    refetch: fetchData,
  } = useQuery(routes.listShiftRequests, {
    query: formatFilter({
      ...qParams,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    }),
  });

  const showShiftingCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="mt-64 flex flex-1 justify-center text-gray-600">
          {t("no_patients_to_show")}
        </div>
      );
    }

    return data.map((shift: any) => (
      <div key={`shift_${shift.id}`} className="mt-6 w-full">
        <div className="h-full overflow-hidden rounded-lg bg-white shadow">
          <div
            className={
              "flex h-full flex-col justify-between p-4 " +
              (shift.patient_object.disease_status == "POSITIVE"
                ? "bg-red-50"
                : "")
            }
          >
            <div>
              <div className="flex justify-between">
                <div className="mb-2 text-xl font-bold capitalize">
                  {shift.patient_object.name} -{" "}
                  {formatAge(
                    shift.patient_object.age,
                    shift.patient_object.date_of_birth,
                    true
                  )}
                </div>
                <div>
                  {shift.emergency && (
                    <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                      {t("emergency")}
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
                <div className="sm:col-span-1">
                  <dt
                    title={t("shifting_status")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-truck" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {shift.status}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title={t("phone_number")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-mobile-android" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {shift.patient_object.phone_number || ""}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title={t("origin_facility")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-plane-departure" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {(shift.origin_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                {wartime_shifting && (
                  <div className="sm:col-span-1">
                    <dt
                      title={t("shifting_approving_facility")}
                      className="flex items-center text-sm font-medium leading-5 text-gray-500"
                    >
                      <CareIcon icon="l-user-check" className="mr-2" />
                      <dd className="text-sm font-bold leading-5 text-gray-900">
                        {(shift.shifting_approving_facility_object || {}).name}
                      </dd>
                    </dt>
                  </div>
                )}
                <div className="sm:col-span-1">
                  <dt
                    title={t("assigned_facility")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-plane-arrival" className="m-2" />

                    <dd className="text-sm font-bold leading-5 text-gray-900">
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
                      "flex items-center text-sm font-medium leading-5 " +
                      (dayjs()
                        .subtract(2, "hours")
                        .isBefore(shift.modified_date)
                        ? "text-gray-900"
                        : "rounded bg-red-400 p-1 text-white")
                    }
                  >
                    <CareIcon icon="l-stopwatch" className="mr-2" />
                    <dd className="text-sm font-bold leading-5">
                      {formatDateTime(shift.modified_date) || "--"}
                    </dd>
                  </dt>
                </div>

                <div className="sm:col-span-1">
                  <dt
                    title={t("patient_address")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-home" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-gray-900">
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
                <CareIcon icon="l-eye" className="mr-2" /> {t("all_details")}
              </ButtonV2>
            </div>
            {shift.status === "COMPLETED" && shift.assigned_facility && (
              <div className="mt-2">
                <ButtonV2
                  className="w-full"
                  disabled={
                    !shift.patient_object.allow_transfer ||
                    !(
                      ["DistrictAdmin", "StateAdmin"].includes(
                        authUser.user_type
                      ) ||
                      authUser.home_facility_object?.id ===
                        shift.assigned_facility
                    )
                  }
                  onClick={() => setModalFor(shift.external_id)}
                >
                  {t("transfer_to_receiving_facility")}
                </ButtonV2>
                <ConfirmDialog
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
          <div className="flex w-full flex-col gap-2 lg:w-fit lg:flex-row lg:gap-4">
            <ButtonV2
              className="py-[11px]"
              onClick={() => navigate("/shifting/board", { query: qParams })}
            >
              <CareIcon icon="l-list-ul" className="rotate-90" />
              {t("board_view")}
            </ButtonV2>

            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>
        </>
      }
    >
      <BadgesList {...{ qParams, FilterBadges }} />
      <div>
        {loading ? (
          <Loading />
        ) : (
          <div>
            <div className="-mb-4 mr-2 mt-4 flex justify-end">
              <button
                className="text-xs hover:text-blue-800"
                onClick={() => fetchData()}
              >
                <CareIcon
                  icon="l-refresh"
                  className="mr-1"
                  aria-hidden="true"
                />
                {t("refresh_list")}
              </button>
            </div>

            <div className="mb-5 grid gap-x-6 md:grid-cols-2">
              {showShiftingCardList(shiftData?.results || [])}
            </div>
            <div>
              <Pagination totalCount={shiftData?.count || 0} />
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
