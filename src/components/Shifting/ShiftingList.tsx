import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ButtonV2 from "@/components/Common/ButtonV2";
import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SearchInput from "@/components/Form/SearchInput";
import BadgesList from "@/components/Shifting/ShiftingBadges";
import { formatFilter } from "@/components/Shifting/ShiftingCommons";
import ListFilter from "@/components/Shifting/ShiftingFilters";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

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
    </Page>
  );
}
