import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import {
  ReactNode,
  RefObject,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import BadgesList from "@/components/Resource/ResourceBadges";
import ResourceBlock from "@/components/Resource/ResourceBlock";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ListFilter from "@/components/Resource/ResourceFilter";

import useExport from "@/hooks/useExport";
import useFilters from "@/hooks/useFilters";

import { RESOURCE_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import { callApi } from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { QueryRoute } from "@/Utils/request/types";
import useTanStackQueryInstead, {
  QueryOptions,
} from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

import Page from "../Common/Page";
import { Badge } from "../ui/badge";
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
  const { exportFile } = useExport();
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

  const exportAction = async () => {
    const { data } = await request(routes.downloadResourceRequests, {
      query: { ...appliedFilters, csv: true },
    });
    return data ?? null;
  };

  const { t } = useTranslation();

  return (
    <Page
      title={t("resource")}
      hideBack={true}
      breadcrumbs={false}
      options={
        <div className="flex gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "board" | "list")}
          >
            <TabsList>
              <TabsTrigger value="board">
                <CareIcon icon="l-kanban" className="mr-2" />
                <span>{t("board")}</span>
              </TabsTrigger>
              <TabsTrigger value="list">
                <CareIcon icon="l-list-ul" className="mr-2" />
                <span>{t("list")}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="secondary"
            className="rounded-md w-full lg:w-auto"
            onClick={() => exportFile(exportAction, "resource_requests", "csv")}
          >
            <CareIcon icon="l-export" />
            <span>{t("Export")}</span>
          </Button>
        </div>
      }
    >
      <div className="mt-4 py-4 flex flex-col md:flex-row gap-4 justify-between border-t border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div>
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
                  <SelectItem value="completed">{t("completed")}</SelectItem>
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

      {viewMode === "board" ? (
        <>
          <Suspense fallback={<Loading />}>
            <ScrollArea>
              <div className="flex w-max space-x-4">
                <ResourceColumn<ResourceRequest>
                  title={<BadgesList {...{ appliedFilters, FilterBadges }} />}
                  sections={boardFilter.map((board) => ({
                    id: board,
                    title: (
                      <h3 className="flex h-8 items-center text-xs gap-2">
                        {board}{" "}
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
                  itemRender={(resource) => (
                    <ResourceBlock resource={resource} />
                  )}
                />
                <ScrollBar orientation="horizontal" />
              </div>
            </ScrollArea>
          </Suspense>
          <ListFilter {...advancedFilter} key={window.location.search} />
        </>
      ) : (
        <div className="w-full">
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
              <ResourceRow data={data?.results || []} />
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
        </div>
      )}
    </Page>
  );
};

interface ResourceColumnProps<T extends { id: string }> {
  title?: ReactNode;
  onDragEnd: OnDragEndResponder<string>;
  sections: {
    id: string;
    title: ReactNode;
    fetchOptions: (
      id: string,
      ...args: unknown[]
    ) => {
      route: QueryRoute<unknown>;
      options?: QueryOptions<unknown>;
    };
  }[];
  itemRender: (item: T) => ReactNode;
}

function ResourceColumn<T extends { id: string }>(
  props: ResourceColumnProps<T>,
) {
  const board = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="flex flex-col justify-between md:flex-row">
        <div>{props.title}</div>
      </div>
      <DragDropContext onDragEnd={props.onDragEnd}>
        <div className="h-full overflow-x-auto scrollbar-hide" ref={board}>
          <div className="flex items-stretch px-0 pb-2">
            {props.sections.map((section, i) => (
              <ResourceCard<T>
                key={i}
                section={section}
                itemRender={props.itemRender}
                boardRef={board}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

interface QueryResponse<T> {
  results: T[];
  next: string | null;
  count: number;
}

function ResourceCard<T extends { id: string }>(
  props: Omit<ResourceColumnProps<T>, "sections" | "onDragEnd"> & {
    section: ResourceColumnProps<T>["sections"][number];
    boardRef: RefObject<HTMLDivElement>;
  },
) {
  const { section } = props;
  const sectionRef = useRef<HTMLDivElement>(null);
  const defaultLimit = 14;
  const { t } = useTranslation();
  const options = section.fetchOptions(section.id);
  const fetchPage = async ({ pageParam = 0 }) => {
    try {
      const data = await callApi(options.route, {
        ...options.options,
        queryParams: {
          ...options.options?.query,
          offset: pageParam,
          limit: defaultLimit,
        },
      });
      return data as QueryResponse<T>;
    } catch (error) {
      console.error("Error fetching section data:", error);
      return { results: [], next: null, count: 0 };
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["board", section.id, options.options?.query],
    queryFn: fetchPage,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.next) return undefined;
      return pages.length * defaultLimit;
    },
    initialPageParam: 0,
  });

  const items = data?.pages?.flatMap((page) => page.results || []) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;
  const { qParams } = useFilters({
    limit: 12,
    cacheBlacklist: ["title"],
  });
  useEffect(() => {
    refetch();
  }, [section.id, refetch]);
  return (
    <Droppable droppableId={section.id}>
      {(provided, _snapshot) => (
        <div
          ref={provided.innerRef}
          className="relative mr-4 w-[320px] shrink-0 rounded-xl bg-gray-100"
        >
          <div className="sticky flex items-center justify-between top-0 rounded-xl pt-2">
            <div className="mx-2 flex items-center justify-between rounded-lg p-2">
              <div>{section.title}</div>
              <div>
                <span className="ml-4 rounded-lg bg-gray-200 py-1 px-2">
                  {isLoading ? "..." : totalCount}
                </span>
              </div>
            </div>
            <ExportButton
              variant="secondary"
              className=" bg-transparent shadow-none text-black rounded-full"
              action={async () => {
                const { data } = await request(
                  routes.downloadResourceRequests,
                  {
                    query: {
                      ...formatFilter({ ...qParams, status: section.id }),
                      csv: true,
                    },
                  },
                );
                return data ?? null;
              }}
              filenamePrefix={`resource_requests_${section.id}`}
            />
          </div>
          <div
            ref={sectionRef}
            className="h-[calc(100vh-265px)] overflow-y-auto overflow-x-hidden"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              if (
                target.scrollTop + target.clientHeight >=
                target.scrollHeight - 100
              ) {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }
            }}
          >
            {!isLoading && items.length === 0 && (
              <div className="flex justify-center items-center h-[calc(100vh-18rem)]">
                <p className="text-gray-500">{t("no_results_found")}</p>
              </div>
            )}
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, _snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mx-2 mt-2 w-[284px] rounded-lg border border-secondary-300 bg-white"
                  >
                    {props.itemRender(item)}
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
            {isFetchingNextPage && (
              <div className="mt-2 h-[300px] w-[284px] animate-pulse rounded-lg bg-secondary-300" />
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}

interface ResourceRowProps {
  data: ResourceRequest[];
}

function ResourceRow({ data }: ResourceRowProps) {
  const { t } = useTranslation();

  if (data && !data.length) {
    return (
      <div className="mt-2 items-center h-[400px]   w-full  flex justify-center text-secondary-600">
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

        <div className="col-span-1 flex flex-col px-3 text-left">
          <div className="3xl:flex-row mb-2 flex gap-2 sm:flex-row md:flex-row lg:flex-col xl:flex-row 2xl:flex-row ">
            {resource.status === "TRANSPORTATION TO BE ARRANGED" ? (
              <dt
                title={t("resource_status")}
                className="w-3/4 mt-1 h-fit flex h-5 shrink-0 items-center  overflow-hidden whitespace-nowrap text-ellipsis truncate"
              >
                <Badge
                  variant="secondary"
                  className="text-lg font-bold text-sky-600 truncate bg-gray-300 rounded-full uppercase text-center"
                >
                  <span className="mr-1">
                    <CareIcon icon="l-truck" />
                  </span>
                  {t(`${resource.status}`)}
                </Badge>
              </dt>
            ) : (
              <dt
                title={t("resource_status")}
                className="w-fit mt-1 h-fit flex h-5 shrink-0 items-center rounded-full  leading-4"
              >
                <Badge
                  variant={
                    resource.status === "APPROVED" ? "primary" : "secondary"
                  }
                  className={`text-lg font-bold rounded-full uppercase ${
                    resource.status === "APPROVED"
                      ? "bg-sky-200"
                      : "bg-yellow-200"
                  }`}
                >
                  <span className="mr-1">
                    <CareIcon icon="l-truck" />
                  </span>
                  {t(`${resource.status}`)}
                </Badge>
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
}

export default ResourcePage;
