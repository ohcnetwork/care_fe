import { navigate } from "raviger";
import ListFilter from "./ListFilter";
import { formatFilter } from "./Commons";
import BadgesList from "./BadgesList";
import { formatDateTime } from "../../Utils/utils";
import useFilters from "@/common/hooks/useFilters";
import { ExportButton } from "@/components/Common/Export";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import dayjs from "../../Utils/dayjs";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import Page from "@/components/Common/components/Page";
import SearchInput from "../Form/SearchInput";
import request from "../../Utils/request/request";

import Loading from "@/components/Common/Loading";
export default function ListView() {
  const {
    qParams,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
    updateQuery,
  } = useFilters({ cacheBlacklist: ["title"] });

  const { t } = useTranslation();

  const onBoardViewBtnClick = () =>
    navigate("/resource/board", { query: qParams });
  const appliedFilters = formatFilter(qParams);

  const { loading, data, refetch } = useQuery(routes.listResourceRequests, {
    query: formatFilter({
      ...qParams,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    }),
  });

  const showResourceCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="mt-64 flex flex-1 justify-center text-secondary-600">
          No requests to show.
        </div>
      );
    }

    return data.map((resource: any) => (
      <div
        key={`resource_${resource.id}`}
        className="mt-6 w-full md:w-1/2 md:px-7"
      >
        <div className="h-full overflow-hidden rounded-lg bg-white shadow">
          <div className={"flex h-full flex-col justify-between p-4"}>
            <div>
              <div className="flex justify-between">
                <div className="mb-2 text-xl font-bold capitalize">
                  {resource.title}
                </div>
                <div>
                  {resource.emergency && (
                    <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                      Emergency
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
                <div className="sm:col-span-1">
                  <dt
                    title="Resource status"
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-truck" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-secondary-900">
                      {resource.status}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title=" Origin facility"
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-plane-departure" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-secondary-900">
                      {(resource.origin_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title="Resource approving facility"
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-user-check" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-secondary-900">
                      {(resource.approving_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title=" Assigned facility"
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-plane-arrival" className="m-2" />

                    <dd className="text-sm font-bold leading-5 text-secondary-900">
                      {(resource.assigned_facility_object || {}).name ||
                        "Yet to be decided"}
                    </dd>
                  </dt>
                </div>

                <div className="sm:col-span-1">
                  <dt
                    title="  Last Modified"
                    className={
                      "flex items-center text-sm font-medium leading-5 " +
                      (dayjs()
                        .subtract(2, "hours")
                        .isBefore(resource.modified_date)
                        ? "text-secondary-900"
                        : "rounded bg-red-400 p-1 text-white")
                    }
                  >
                    <CareIcon icon="l-stopwatch" className="mr-2" />
                    <dd className="text-sm font-bold leading-5">
                      {formatDateTime(resource.modified_date) || "--"}
                    </dd>
                  </dt>
                </div>
              </dl>
            </div>

            <div className="mt-2 flex">
              <button
                data-testid="resource-details"
                onClick={(_) => navigate(`/resource/${resource.id}`)}
                className="btn btn-default mr-2 w-full bg-white"
              >
                <CareIcon icon="l-eye" className="mr-2" /> All Details
              </button>
            </div>
          </div>
        </div>
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

            <div className="mb-5 flex flex-wrap md:-mx-4">
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
