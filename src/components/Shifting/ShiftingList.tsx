import { useState } from "react";
import BadgesList from "./ShiftingBadges";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { ExportButton } from "@/components/Common/Export";
import ListFilter from "./ShiftingFilters";
import Page from "@/components/Common/components/Page";
import SearchInput from "../Form/SearchInput";
import { formatFilter } from "./ShiftingCommons";
import { navigate } from "raviger";
import useFilters from "@/common/hooks/useFilters";
import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Loading from "@/components/Common/Loading";
import { ShiftingModel } from "../Facility/models";
import ShiftingBlock from "./ShiftingBlock";

export default function ListView() {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({ cacheBlacklist: ["patient_name"], limit: 12 });

  const [modalFor, setModalFor] = useState<ShiftingModel>();
  const { t } = useTranslation();

  const handleTransferComplete = async (shift?: ShiftingModel) => {
    if (!shift) return;
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
      limit: resultsPerPage,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    }),
  });

  const showShiftingCardList = (data: ShiftingModel[]) => {
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
      <div>
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((shift, i) => (
            <div
              key={i}
              className="rounded-lg border border-secondary-300 bg-white"
            >
              <ShiftingBlock
                onTransfer={() => setModalFor(shift)}
                shift={shift}
              />
            </div>
          ))}
        </div>
        <ConfirmDialog
          title={t("confirm_transfer_complete")}
          description={t("mark_transfer_complete_confirmation")}
          action="Confirm"
          show={!!modalFor}
          onClose={() => setModalFor(undefined)}
          onConfirm={() => handleTransferComplete(modalFor)}
        />
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
