import { useState, useEffect, lazy } from "react";

import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import {
  listResourceRequests,
  downloadResourceRequests,
} from "../../Redux/actions";
import ListFilter from "./ListFilter";
import { formatFilter } from "./Commons";
import BadgesList from "./BadgesList";
import { formatDateTime } from "../../Utils/utils";
import useFilters from "../../Common/hooks/useFilters";
import { ExportButton } from "../Common/Export";
import ButtonV2 from "../Common/components/ButtonV2";
import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import dayjs from "../../Utils/dayjs";

const Loading = lazy(() => import("../Common/Loading"));
const PageTitle = lazy(() => import("../Common/PageTitle"));

export default function ListView() {
  const dispatch: any = useDispatch();
  const { qParams, Pagination, FilterBadges, advancedFilter, resultsPerPage } =
    useFilters({});
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const onBoardViewBtnClick = () =>
    navigate("/resource/board-view", { query: qParams });
  const appliedFilters = formatFilter(qParams);

  const refreshList = () => {
    fetchData();
  };

  const fetchData = () => {
    setIsLoading(true);
    dispatch(
      listResourceRequests(
        formatFilter({
          ...qParams,
          offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        }),
        "resource-list-call"
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
    qParams.origin_facility,
    qParams.approving_facility,
    qParams.assigned_facility,
    qParams.emergency,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.modified_date_before,
    qParams.modified_date_after,
    qParams.ordering,
    qParams.page,
  ]);

  const showResourceCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="mt-64 flex flex-1 justify-center text-gray-600">
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
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <i className="fas fa-truck mr-2" />
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {resource.status}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title=" Origin facility"
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <i className="fas fa-plane-departure mr-2"></i>
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {(resource.origin_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title="Resource approving facility"
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <i className="fas fa-user-check mr-2"></i>
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {(resource.approving_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title=" Assigned facility"
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <i className="fas fa-plane-arrival mr-2"></i>

                    <dd className="text-sm font-bold leading-5 text-gray-900">
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
                        ? "text-gray-900"
                        : "rounded bg-red-400 p-1 text-white")
                    }
                  >
                    <i className="fas fa-stopwatch mr-2"></i>
                    <dd className="text-sm font-bold leading-5">
                      {formatDateTime(resource.modified_date) || "--"}
                    </dd>
                  </dt>
                </div>
              </dl>
            </div>

            <div className="mt-2 flex">
              <button
                onClick={(_) => navigate(`/resource/${resource.external_id}`)}
                className="btn btn-default mr-2 w-full bg-white"
              >
                <i className="fas fa-eye mr-2" /> All Details
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex h-screen flex-col px-2 pb-2">
      <div className="px-4 md:flex md:items-center md:justify-between">
        <PageTitle
          title="Resource"
          hideBack
          componentRight={
            <ExportButton
              action={() =>
                downloadResourceRequests({ ...appliedFilters, csv: 1 })
              }
              filenamePrefix="resource_requests"
            />
          }
          breadcrumbs={false}
        />

        <div className="w-32" />
        <div className="flex w-full flex-col gap-2 lg:w-fit lg:flex-row lg:gap-4">
          <ButtonV2 className="py-[11px]" onClick={onBoardViewBtnClick}>
            <CareIcon className="care-l-list-ul rotate-90" />
            {t("board_view")}
          </ButtonV2>

          <AdvancedFilterButton onClick={() => advancedFilter.setShow(true)} />
        </div>
      </div>

      <BadgesList {...{ appliedFilters, FilterBadges }} />

      <div className="px-1">
        {isLoading ? (
          <Loading />
        ) : (
          <div>
            <div className="-mb-4 mr-2 mt-4 flex justify-end">
              <button
                className="text-xs hover:text-blue-800"
                onClick={refreshList}
              >
                <i className="fa fa-refresh mr-1" aria-hidden="true"></i>
                Refresh List
              </button>
            </div>

            <div className="mb-5 flex flex-wrap md:-mx-4">
              {showResourceCardList(data)}
            </div>
            <Pagination totalCount={totalCount} />
          </div>
        )}
      </div>
      <ListFilter
        {...advancedFilter}
        showResourceStatus={true}
        key={window.location.search}
      />
    </div>
  );
}
