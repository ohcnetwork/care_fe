import { useState } from "react";
import BadgesList from "./BadgesList";
import ButtonV2 from "../Common/components/ButtonV2";
import ConfirmDialog from "../Common/ConfirmDialog";
import { ExportButton } from "../Common/Export";
import ListFilter from "./ListFilter";
import Page from "../Common/components/Page";
import SearchInput from "../Form/SearchInput";
import { formatDateTime } from "../../Utils/utils";
import { formatFilter } from "./Commons";
import { navigate } from "raviger";
import useFilters from "../../Common/hooks/useFilters";
import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import dayjs from "../../Utils/dayjs";
import useAuthUser from "../../Common/hooks/useAuthUser";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import careConfig from "@careConfig";
import Loading from "@/Components/Common/Loading";
import { IShift } from "./models";

export default function ListView() {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({ cacheBlacklist: ["patient_name"] });

  const [modalFor, setModalFor] = useState<{
    external_id: string | undefined;
    loading: boolean;
  }>({
    external_id: undefined,
    loading: false,
  });
  const authUser = useAuthUser();
  const { t } = useTranslation();

  const handleTransferComplete = async (shift: IShift) => {
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

  const showShiftingCardList = (data: IShift[]) => {
    if (loading) {
      return <Loading />;
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="text-2xl font-bold text-secondary-600">
            {t("no_patients_to_show")}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-5 grid gap-x-6 md:grid-cols-2">
        {data.map((shift: IShift) => (
          <div key={`shift_${shift.id}`} className="mt-6 w-full">
            <div className="h-full overflow-hidden rounded-lg bg-white shadow">
              <div className="flex h-full flex-col justify-between p-4">
                <div>
                  <div className="flex justify-between">
                    <div className="mb-2 text-xl font-bold capitalize">
                      {shift.patient_object.name} - {shift.patient_object.age}
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
                        className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                      >
                        <CareIcon icon="l-truck" className="mr-2" />
                        <dd className="text-sm font-bold leading-5 text-secondary-900">
                          {shift.status}
                        </dd>
                      </dt>
                    </div>
                    <div className="sm:col-span-1">
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
                    <div className="sm:col-span-1">
                      <dt
                        title={t("origin_facility")}
                        className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                      >
                        <CareIcon icon="l-plane-departure" className="mr-2" />
                        <dd className="text-sm font-bold leading-5 text-secondary-900">
                          {(shift.origin_facility_object || {}).name}
                        </dd>
                      </dt>
                    </div>
                    {careConfig.wartimeShifting && (
                      <div className="sm:col-span-1">
                        <dt
                          title={t("shifting_approving_facility")}
                          className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                        >
                          <CareIcon icon="l-user-check" className="mr-2" />
                          <dd className="text-sm font-bold leading-5 text-secondary-900">
                            {
                              (shift.shifting_approving_facility_object || {})
                                .name
                            }
                          </dd>
                        </dt>
                      </div>
                    )}
                    <div className="sm:col-span-1">
                      <dt
                        title={t("assigned_facility")}
                        className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                      >
                        <CareIcon icon="l-plane-arrival" className="m-2" />

                        <dd className="text-sm font-bold leading-5 text-secondary-900">
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
                            ? "text-secondary-900"
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
                        className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                      >
                        <CareIcon icon="l-home" className="mr-2" />
                        <dd className="text-sm font-bold leading-5 text-secondary-900">
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
                    <CareIcon icon="l-eye" className="mr-2" />{" "}
                    {t("all_details")}
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
                            authUser.user_type,
                          ) ||
                          authUser.home_facility_object?.id ===
                            shift.assigned_facility
                        )
                      }
                      onClick={() =>
                        setModalFor({
                          external_id: shift.external_id,
                          loading: false,
                        })
                      }
                    >
                      {t("transfer_to_receiving_facility")}
                    </ButtonV2>
                    <ConfirmDialog
                      title={t("confirm_transfer_complete")}
                      description={t("mark_transfer_complete_confirmation")}
                      action="Confirm"
                      show={modalFor.external_id === shift.external_id}
                      onClose={() =>
                        setModalFor({ external_id: undefined, loading: false })
                      }
                      onConfirm={() => handleTransferComplete(shift)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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

            {showShiftingCardList(shiftData?.results || [])}

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
