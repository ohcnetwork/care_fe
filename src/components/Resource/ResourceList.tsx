import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import { Button } from "@/components/ui/button";

import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { ResourceModel } from "@/components/Facility/models";
import SearchInput from "@/components/Form/SearchInput";
import BadgesList from "@/components/Resource/ResourceBadges";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ListFilter from "@/components/Resource/ResourceFilter";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";

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

  const onBoardViewBtnClick = () => {
    navigate("/resource/board", { query: qParams });
    localStorage.setItem("defaultResourceView", "board");
  };
  const appliedFilters = formatFilter(qParams);

  const { loading, data, refetch } = useTanStackQueryInstead(
    routes.listResourceRequests,
    {
      query: formatFilter({
        ...qParams,
        limit: resultsPerPage,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
      }),
    },
  );

  const showResourceCardList = (data: ResourceModel[]) => {
    if (data && !data.length) {
      return (
        <div className="w-full mt-64 flex flex-1 justify-center text-secondary-600">
          {t("no_results_found")}
        </div>
      );
    }

    return data.map((resource: ResourceModel, i) => (
      <div
        key={i}
        className="w-full border border-b-2 border-gray-200  col-span-6"
      >
        <div className=" flex grid w-full gap-1 overflow-hidden bg-white p-4    sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-5">
          <div className="col-span-1 px-3 text-left">
            <div className="text-sm font-bold capitalize">{resource.title}</div>
          </div>

          <div className="col-span-1 flex flex-col px-2 text-left">
            <div className="category">
              <dt
                title={t("LOG_UPDATE_FIELD_LABEL__patient_category")}
                className="flex items-center text-sm font-medium leading-5 text-secondary-500"
              >
                <CareIcon icon="l-box" className="text-lg mr-1" />
                <dd className="text-sm font-bold leading-5 text-secondary-900">
                  {resource.category || ""}
                </dd>
              </dt>
            </div>
            <div className="address mt-1">
              <dd className="text-xs font-medium leading-5">
                {resource.sub_category || "--"}
              </dd>
            </div>
          </div>

          <div className="col-span-1 flex flex-col px-3 text-left">
            <div className="3xl:flex-row mb-2 flex gap-2 sm:flex-row md:flex-row lg:flex-col xl:flex-row 2xl:flex-row ">
              {resource.status === "TRANSPORTATION TO BE ARRANGED" ? (
                <dt
                  title={t("resource_status")}
                  className="w-3/4 mt-1 h-fit flex h-5 shrink-0 items-center  overflow-hidden whitespace-nowrap text-ellipsis truncate"
                >
                  <Chip
                    size="small"
                    variant="secondary"
                    startIcon="l-truck"
                    text={t(`${resource.status}`)}
                    className="text-lg font-bold text-sky-600 truncate bg-gray-300 rounded-full uppercase text-center"
                  />
                </dt>
              ) : (
                <dt
                  title={t("resource_status")}
                  className="w-fit mt-1 h-fit flex h-5 shrink-0 items-center rounded-full  leading-4"
                >
                  <Chip
                    size="small"
                    variant={
                      resource.status === "APPROVED" ? "primary" : "secondary"
                    }
                    startIcon="l-truck"
                    text={t(`${resource.status}`)}
                    className={`text-lg font-bold rounded-full uppercase ${
                      resource.status === "APPROVED"
                        ? "bg-sky-200"
                        : "bg-yellow-200 "
                    }`}
                  />
                </dt>
              )}

              <div>
                {resource.emergency && (
                  <span className="mt-1.5 inline-block shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-medium leading-4 text-red-800">
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
                  {formatDateTime(resource.modified_date) || "--"}
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
                {resource.origin_facility_object?.name}
              </dd>
            </dt>

            <dt
              title={t("resource_approving_facility")}
              className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
            >
              <CareIcon icon="l-user-check" className="mr-2" />
              <dd className="text-sm font-bold leading-5 text-secondary-900">
                {resource.approving_facility_object?.name}
              </dd>
            </dt>

            <dt
              title={t("assigned_facility")}
              className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
            >
              <CareIcon icon="l-plane-arrival" className="mr-2" />
              <dd className="text-sm font-bold leading-5 text-secondary-900">
                {resource.assigned_facility_object?.name ||
                  t("yet_to_be_decided")}
              </dd>
            </dt>
          </div>
          <div className="col-span-1 mt-2 flex flex-col text-left">
            <Link
              href={`/resource/${resource.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
            >
              <CareIcon icon="l-eye" className="text-lg" /> {t("all_details")}
            </Link>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Page
      title={t("resource")}
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
          <div className="md:px-4"></div>
          <div className="mt-2 flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
            <SearchInput
              name="title"
              value={qParams.title}
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              placeholder={t("search_resource")}
            />
          </div>

          <div className="mt-2 flex w-full flex-col gap-2 lg:w-fit lg:flex-row lg:gap-4">
            <Button variant={"primary"} onClick={onBoardViewBtnClick}>
              <CareIcon icon="l-list-ul" className="rotate-90 mr-2" />
              {t("board_view")}
            </Button>
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
            <div className="mx-5 mt-5 grid w-full gap-2 border-b-2 border-gray-100 p-4 text-sm font-medium sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-5">
              <div className="col-span-1 uppercase sm:text-center md:text-center lg:block lg:text-left">
                {t("resource")}
              </div>
              <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
                {t("LOG_UPDATE_FIELD_LABEL__patient_category")}
              </div>
              <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
                {t("consent__status")}
              </div>
              <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
                {t("facilities")}
              </div>
              <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
                {t("LOG_UPDATE_FIELD_LABEL__action")}
              </div>
            </div>
            <div>{showResourceCardList(data?.results || [])}</div>
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
