import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ButtonV2 from "@/components/Common/ButtonV2";
import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { ResourceModel } from "@/components/Facility/models";
import SearchInput from "@/components/Form/SearchInput";
import BadgesList from "@/components/Resource/ResourceBadges";
import ResourceBlock from "@/components/Resource/ResourceBlock";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ListFilter from "@/components/Resource/ResourceFilter";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

export default function ListView() {
  const {
    qParams,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
    updateQuery,
  } = useFilters({ cacheBlacklist: ["title"], limit: 12 });

  const { t } = useTranslation();

  const onBoardViewBtnClick = () =>
    navigate("/resource/board", { query: qParams });
  const appliedFilters = formatFilter(qParams);

  const { loading, data, refetch } = useQuery(routes.listResourceRequests, {
    query: formatFilter({
      ...qParams,
      limit: resultsPerPage,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    }),
  });

  const showResourceCardList = (data: ResourceModel[]) => {
    if (data && !data.length) {
      return (
        <div className="mt-64 flex flex-1 justify-center text-secondary-600">
          {t("no_results_found")}
        </div>
      );
    }

    return data.map((resource, i) => (
      <div key={i} className="rounded-lg border border-secondary-300 bg-white">
        <ResourceBlock resource={resource} />
      </div>
    ));
  };

  return (
    <Page
      title="Resource"
      hideBack
      componentRight={
        <ExportButton
          action={async () => {
            const { data } = await request(routes.downloadResourceRequests, {
              query: { ...appliedFilters, csv: true },
            });
            return data ?? null;
          }}
          filenamePrefix="resource_requests"
        />
      }
      breadcrumbs={false}
      options={
        <>
          <div className="md:px-4">
            <SearchInput
              name="title"
              value={qParams.title}
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              placeholder={t("search_resource")}
            />
          </div>
          <div className="w-32">
            {/* dummy div to align space as per board view */}
          </div>
          <div className="flex w-full flex-col gap-2 lg:w-fit lg:flex-row lg:gap-4">
            <ButtonV2 className="py-[11px]" onClick={onBoardViewBtnClick}>
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
      <BadgesList {...{ appliedFilters, FilterBadges }} />

      <div className="px-1">
        {loading ? (
          <Loading />
        ) : (
          <div>
            <div className="-mb-4 mr-2 mt-4 flex justify-end">
              <button
                className="text-xs hover:text-blue-800"
                onClick={() => refetch()}
              >
                <CareIcon
                  icon="l-refresh"
                  className="mr-1"
                  aria-hidden="true"
                />
                {t("refresh_list")}
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.results && showResourceCardList(data?.results)}
            </div>
            <div>
              <Pagination totalCount={data?.count || 0} />
            </div>
          </div>
        )}
      </div>
      <ListFilter
        {...advancedFilter}
        showResourceStatus={true}
        key={window.location.search}
      />
    </Page>
  );
}
