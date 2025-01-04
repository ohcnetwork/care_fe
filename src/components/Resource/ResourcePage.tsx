import { Link, navigate } from "raviger";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import type { KanbanBoardType } from "@/components/Kanban/Board";
import BadgesList from "@/components/Resource/ResourceBadges";
import ResourceBlock from "@/components/Resource/ResourceBlock";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ListFilter from "@/components/Resource/ResourceFilter";

import useFilters from "@/hooks/useFilters";

import { RESOURCE_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

import Page from "../Common/Page";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const KanbanBoard = lazy(
  () => import("@/components/Kanban/Board"),
) as KanbanBoardType;

const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED"];
const ACTIVE = resourceStatusOptions.filter((o) => !COMPLETED.includes(o));

const ResourcePage = () => {
  const {
    qParams,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
    updateQuery,
  } = useFilters({
    limit: 12,
    cacheBlacklist: ["title"],
  });
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  // eslint-disable-next-line
  const appliedFilters = formatFilter(qParams);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
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
  const { t } = useTranslation();

  const showResourceCardList = (data: ResourceRequest[]) => {
    if (data && !data.length) {
      return (
        <div className="w-full mt-64 flex flex-1 justify-center text-secondary-600">
          {t("no_results_found")}
        </div>
      );
    }

    return data.map((resource: ResourceRequest, i) => (
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
                {resource.origin_facility?.name}
              </dd>
            </dt>

            <dt
              title={t("resource_approving_facility")}
              className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
            >
              <CareIcon icon="l-user-check" className="mr-2" />
              <dd className="text-sm font-bold leading-5 text-secondary-900">
                {resource.approving_facility?.name}
              </dd>
            </dt>

            <dt
              title={t("assigned_facility")}
              className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
            >
              <CareIcon icon="l-plane-arrival" className="mr-2" />
              <dd className="text-sm font-bold leading-5 text-secondary-900">
                {resource.assigned_facility?.name || t("yet_to_be_decided")}
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
      hideBack={true}
      breadcrumbs={false}
      options={
        <>
          <div className="flex lg:flex-row flex-col w-full justify-end gap-2">
            <div>
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "board" | "list")
                }
              >
                <TabsList className="w-full lg:w-auto">
                  <TabsTrigger value="board" className="w-1/2">
                    <CareIcon icon="l-kanban" className="mr-2" />
                    <span>{t("board")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="w-1/2 lg:w-auto">
                    <CareIcon icon="l-list-ul" className="mr-2" />
                    <span>{t("list")}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="secondary"
              className="rounded-md w-full lg:w-auto"
              onClick={async () => {
                const { data } = await request(
                  routes.downloadResourceRequests,
                  {
                    query: { ...appliedFilters, csv: true },
                  },
                );
                return data ?? null;
              }}
            >
              <CareIcon icon="l-export" />
              <span>Export</span>
            </Button>
          </div>
        </>
      }
    >
      {viewMode === "board" ? (
        <>
          <div className="mt-4 py-4 flex flex-col md:flex-row gap-4 justify-between border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-full">
                <Label className="mb-2 text-black">{t("select_status")}</Label>

                <Select
                  defaultValue="active"
                  onValueChange={(value) =>
                    setBoardFilter(value === "completed" ? COMPLETED : ACTIVE)
                  }
                >
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue defaultValue={"completed"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="completed">
                        {t("completed")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Input
                className="w-[300px]"
                placeholder={t("search_resource")}
                value={qParams.title}
                onChange={(e) => updateQuery({ title: e.target.value })}
              />
              <Button
                variant="secondary"
                onClick={() => advancedFilter.setShow(true)}
              >
                <CareIcon icon="l-filter" className="mr-2" />
                <span>{t("filter")}</span>
              </Button>
            </div>
          </div>

          <Suspense fallback={<Loading />}>
            <ScrollArea>
              <KanbanBoard<ResourceRequest>
                title={<BadgesList {...{ appliedFilters, FilterBadges }} />}
                sections={boardFilter.map((board) => ({
                  id: board,
                  title: (
                    <h3 className="flex h-8 items-center text-xs gap-2">
                      {board}{" "}
                      <ExportButton
                        variant="secondary"
                        className=" bg-transparent shadow-none text-black rounded-full"
                        action={async () => {
                          const { data } = await request(
                            routes.downloadResourceRequests,
                            {
                              query: {
                                ...formatFilter({ ...qParams, status: board }),
                                csv: true,
                              },
                            },
                          );
                          return data ?? null;
                        }}
                        filenamePrefix={`resource_requests_${board}`}
                      />
                    </h3>
                  ),
                  fetchOptions: (id) => ({
                    route: routes.listResourceRequests,
                    options: {
                      query: formatFilter({
                        ...qParams,
                        status: id,
                      }),
                    },
                  }),
                }))}
                onDragEnd={(result) => {
                  if (
                    result.source.droppableId !==
                    result.destination?.droppableId
                  )
                    navigate(
                      `/resource/${result.draggableId}/update?status=${result.destination?.droppableId}`,
                    );
                }}
                itemRender={(resource) => <ResourceBlock resource={resource} />}
              />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Suspense>
          <ListFilter {...advancedFilter} key={window.location.search} />
        </>
      ) : (
        <>
          <div className="mt-4 py-4 flex flex-col md:flex-row gap-4 justify-end border-t border-gray-200">
            <div className="flex gap-4 items-center mt-[11px]">
              <Input
                className="w-[300px]"
                placeholder={t("search_resource")}
                value={qParams.title}
                onChange={(e) => updateQuery({ title: e.target.value })}
              />
              <Button
                variant="secondary"
                onClick={() => advancedFilter.setShow(true)}
              >
                <CareIcon icon="l-filter" className="mr-2" />
                <span>{t("filter")}</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="w-full flex flex-col">
              <div className="-mb-4 mr-2 mt-4 flex justify-end">
                <BadgesList {...{ appliedFilters, FilterBadges }} />

                <button
                  className="text-xs hover:text-blue-800 w-[90px]"
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

          <ListFilter
            {...advancedFilter}
            showResourceStatus={true}
            key={window.location.search}
          />
        </>
      )}
    </Page>
  );
};

export default ResourcePage;
