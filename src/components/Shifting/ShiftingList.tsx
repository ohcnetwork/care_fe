import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import { Button } from "@/components/ui/button";

import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import SearchInput from "@/components/Form/SearchInput";
import BadgesList from "@/components/Shifting/ShiftingBadges";
import { formatFilter } from "@/components/Shifting/ShiftingCommons";
import ListFilter from "@/components/Shifting/ShiftingFilters";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import ShiftingTable from "./ShiftingTable";

export default function ListView() {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({ cacheBlacklist: ["patient_name"] });

  const { t } = useTranslation();
  const onBoardViewBtnClick = () => {
    navigate("/shifting/board", { query: qParams });
    localStorage.setItem("defaultShiftView", "board");
  };
  const {
    data: shiftData,
    loading,
    refetch: fetchData,
  } = useTanStackQueryInstead(routes.listShiftRequests, {
    query: formatFilter({
      ...qParams,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    }),
  });

  return (
    <div className="flex-col px-2 pb-2">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title={t("shifting")}
            className="mx-3 md:mx-5"
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
          />
        </div>
        <div className="flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_patient")}
            className="w-full md:w-60"
          />

          <div className="flex w-full flex-col gap-2 lg:mr-4 lg:w-fit lg:flex-row lg:gap-4">
            <Button
              variant={"primary"}
              onClick={onBoardViewBtnClick}
              className="h-10.8 px-4 py-2"
            >
              <CareIcon icon="l-list-ul" className="mr-2" />
              {t("board_view")}
            </Button>
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>
        </div>
      </div>

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
            <ShiftingTable data={shiftData?.results} loading={loading} />
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
    </div>
  );
}
