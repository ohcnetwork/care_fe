import careConfig from "@careConfig";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import useAuthUser from "../../Common/hooks/useAuthUser";
import useFilters from "../../Common/hooks/useFilters";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import useQuery from "../../Utils/request/useQuery";
import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import { ExportButton } from "../Common/Export";
import SearchInput from "../Form/SearchInput";
import BadgesList from "./BadgesList";
import { formatFilter } from "./Commons";
import ListFilter from "./ListFilter";

import Loading from "@/Components/Common/Loading";
import { formatDateTime } from "@/Utils/utils";
import ConfirmDialog from "../Common/ConfirmDialog";
export default function ListView() {
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
      `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`,
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
        <div className="mt-64 flex flex-1 justify-center text-secondary-600">
          {t("no_patients_to_show")}
        </div>
      );
    }

    return data.map((shift: any) => (
      <div
        key={`shift_${shift.id}`}
        className="w-full border-b-2 border-gray-100"
      >
        <div className="border-3 flex grid w-full grid-cols-5 gap-1 overflow-hidden bg-white p-4 shadow">
          <div className="col-span-1 px-2 text-left">
            <div className="text-sm font-bold capitalize">
              {shift.patient_object.name}
            </div>
            <div className="text-xs font-semibold capitalize">
              {shift.patient_object.age}
            </div>
          </div>

          <div className="col-span-1 flex flex-col px-2 text-left">
            <div className="phone number">
              <dt
                title={t("phone_number")}
                className="flex items-center text-sm font-medium leading-5 text-secondary-500"
              >
                <CareIcon icon="l-mobile-android" className="mr-2" />
                <dd className="text-sm font-bold leading-5 text-secondary-900">
                  {shift.patient_object.phone_number || ""}
                </dd>
              </dt>
            </div>
            <div className="address mt-1">
              <dt
                title={t("patient_address")}
                className="flex items-center text-sm font-medium leading-5 text-secondary-500"
              >
                <CareIcon icon="l-home" className="mr-2" />
                <dd className="font-xs leading-5 text-secondary-900">
                  {shift.patient_object.address || "--"}
                </dd>
              </dt>
            </div>
          </div>

          <div className="col-span-1 flex flex-col px-3 text-left">
            <div className="flex-between mb-2 flex gap-4">
              <dt
                title={t("shifting_status")}
                className={`flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${
                  shift.status === "COMPLETED"
                    ? "bg-sky-200"
                    : "bg-yellow-200 text-yellow-500"
                }`}
              >
                <CareIcon icon="l-truck" className="mr-2" />
                <dd className="text-sky-600">{shift.status}</dd>
              </dt>
              <div>
                {shift.emergency && (
                  <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                    {t("emergency")}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center">
              <dt
                title={t("last_modified")}
                className={"flex items-center text-sm font-medium leading-5"}
              >
                <CareIcon icon="l-stopwatch" className="mr-1" />
                <dd className="text-xs font-medium leading-5">
                  {formatDateTime(shift.modified_date) || "--"}
                </dd>
              </dt>
            </div>
          </div>

          <div className="col-span-1 text-left">
            <dt
              title={t("origin_facility")}
              className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
            >
              <CareIcon icon="l-plane-departure" className="mr-2" />
              <dd className="text-sm font-bold leading-5 text-secondary-900">
                {(shift.origin_facility_object || {}).name}
              </dd>
            </dt>

            {careConfig.wartimeShifting && (
              <dt
                title={t("shifting_approving_facility")}
                className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
              >
                <CareIcon icon="l-user-check" className="mr-2" />
                <dd className="text-sm font-bold leading-5 text-secondary-900">
                  {(shift.shifting_approving_facility_object || {}).name}
                </dd>
              </dt>
            )}

            <dt
              title={t("assigned_facility")}
              className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
            >
              <CareIcon icon="l-plane-arrival" className="mr-2" />
              <dd className="text-sm font-bold leading-5 text-secondary-900">
                {shift.assigned_facility_external ||
                  shift.assigned_facility_object?.name ||
                  t("yet_to_be_decided")}
              </dd>
            </dt>
          </div>
          <div className="col-span-1 mt-2 flex flex-col text-left">
            <ButtonV2
              onClick={(_) => navigate(`/shifting/${shift.external_id}`)}
              variant="secondary"
              border
              className="w-full"
            >
              <CareIcon icon="l-eye" className="mr-2" /> {t("all_details")}
            </ButtonV2>
            {shift.status === "COMPLETED" && shift.assigned_facility && (
              <div className="mt-2">
                <ButtonV2
                  className="w-full"
                  disabled={
                    !shift.patient_object.allow_transfer ||
                    !(
                      ["DistrictAdmin", "StateAdmin"].includes(
                        authUser.user_type,
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
          action={async () => {
            const { data } = await request(routes.downloadShiftRequests, {
              query: { ...formatFilter(qParams), csv: true },
            });
            return data ?? null;
          }}
          filenamePrefix="shift_requests"
        />
      }
      breadcrumbs={false}
      options={
        <>
          <div className="md:px-4"></div>

          <div className="mt-2 flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
            <SearchInput
              name="patient_name"
              value={qParams.patient_name}
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              placeholder={t("search_patient")}
            />
          </div>

          <div className="mt-2 flex w-full flex-col gap-2 lg:w-fit lg:flex-row lg:gap-4">
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
            <ButtonV2
              className="py-[11px]"
              onClick={() => navigate("/shifting/board", { query: qParams })}
            >
              <CareIcon icon="l-list-ul" className="rotate-90" />
              {t("board_view")}
            </ButtonV2>
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
            <div className="-mb-2 mr-2 mt-2 flex justify-end">
              <button
                className="text-sm hover:text-blue-800"
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
            <div>
              <div className="mx-10 mt-5 grid w-full grid-cols-5 gap-2 border-b-2 border-gray-100 p-4 text-sm font-medium">
                <div className="col-span-1 text-left">
                  {t("patients").toUpperCase()}
                </div>
                <div className="col-span-1 text-left">CONTACT INFO</div>
                <div className="col-span-1 text-left">
                  {t("consent__status").toUpperCase()}
                </div>
                <div className="col-span-1 text-left">
                  {t("facilities").toUpperCase()}
                </div>
                <div className="col-span-1 text-left">
                  {" "}
                  {t("LOG_UPDATE_FIELD_LABEL__action").toUpperCase()}
                </div>
              </div>
              <div>{showShiftingCardList(shiftData?.results || [])}</div>
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
