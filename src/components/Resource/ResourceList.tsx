import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import {
  RESOURCE_CATEGORY_CHOICES,
  RESOURCE_STATUS_CHOICES,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

const COMPLETED = ["completed", "rejected", "cancelled"];
const ACTIVE = RESOURCE_STATUS_CHOICES.map((o) => o.text).filter(
  (o) => !COMPLETED.includes(o),
);

function EmptyState() {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t("no_resources_found")}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_resource_filters")}
      </p>
    </Card>
  );
}

export default function ResourceList({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["title"],
  });
  const { status, title, outgoing } = qParams;

  const searchOptions = [
    {
      key: "title",
      label: "Title",
      type: "text" as const,
      placeholder: t("search_by_resource_title"),
      value: title || "",
    },
  ];

  const isActive = !status || !COMPLETED.includes(status);
  const currentStatuses = isActive ? ACTIVE : COMPLETED;

  // Set default status based on active/completed tab
  const defaultStatus = isActive ? "pending" : "completed";
  const currentStatus = status || defaultStatus;

  const { data: queryResources, isLoading } = useQuery<
    PaginatedResponse<ResourceRequest>
  >({
    queryKey: ["resources", facilityId, qParams],
    queryFn: query.debounced(routes.listResourceRequests, {
      queryParams: {
        status: currentStatus,
        title,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        ...(outgoing
          ? { origin_facility: facilityId }
          : { assigned_facility: facilityId }),
      },
    }),
  });

  const resources = queryResources?.results || [];

  return (
    <Page
      title={t("resource")}
      componentRight={
        <Badge
          className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3 w-max"
          variant="outline"
        >
          {isLoading
            ? t("loading")
            : t("entity_count", {
                count: queryResources?.count ?? 0,
                entity: "Resource",
              })}
        </Badge>
      }
    >
      <div className="space-y-4 mt-4">
        <div className="border border-gray-200 rounded-lg">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      data-cy="search-resource"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 min-w-[120px] justify-start",
                        title &&
                          "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                    >
                      <CareIcon icon="l-search" className="mr-2 size-4" />
                      {title ? (
                        <span className="truncate">{title}</span>
                      ) : (
                        t("search")
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[20rem] p-3"
                    align="start"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                  >
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">
                        {t("search_resource")}
                      </h4>
                      <SearchByMultipleFields
                        id="resource-search"
                        options={searchOptions}
                        initialOptionIndex={0}
                        onFieldChange={() =>
                          updateQuery({
                            status: currentStatus,
                            title: undefined,
                          })
                        }
                        onSearch={(key, value) =>
                          updateQuery({
                            status: currentStatus,
                            [key]: value || undefined,
                          })
                        }
                        className="w-full border-none shadow-none"
                        autoFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="items-center">
                  <Tabs
                    value={outgoing ? "outgoing" : "incoming"}
                    className="w-full"
                  >
                    <TabsList className="bg-transparent p-0 h-8">
                      <TabsTrigger
                        value="outgoing"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            outgoing: true,
                            title,
                          })
                        }
                        data-cy="tab-outgoing"
                      >
                        {t("outgoing")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="incoming"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            outgoing: false,
                            title,
                          })
                        }
                        data-cy="tab-incoming"
                      >
                        {t("incoming")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="items-center">
                <Tabs
                  value={isActive ? "active" : "completed"}
                  className="w-full"
                >
                  <TabsList className="bg-transparent p-0 h-8">
                    <TabsTrigger
                      value="active"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status: "pending",
                          title,
                        })
                      }
                    >
                      {t("active")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status: "completed",
                          title,
                        })
                      }
                    >
                      {t("completed")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Separator />

            <div className="p-4 h-auto overflow-hidden">
              <Tabs value={currentStatus} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto flex-wrap justify-start gap-y-2 overflow-auto">
                  {currentStatuses.map((statusOption) => (
                    <TabsTrigger
                      key={statusOption}
                      value={statusOption}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      data-cy={`tab-${statusOption}`}
                      onClick={() =>
                        updateQuery({
                          status: statusOption,
                          title,
                        })
                      }
                    >
                      <CareIcon
                        icon={
                          RESOURCE_STATUS_CHOICES.find(
                            (o) => o.text === statusOption,
                          )?.icon || "l-folder-open"
                        }
                        className="size-4"
                      />
                      {t(`resource_status__${statusOption}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : resources.length === 0 ? (
            <div className="col-span-full">
              <EmptyState />
            </div>
          ) : (
            <>
              {resources.map((resource: ResourceRequest, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow group flex flex-col justify-between"
                  data-cy={`resource-card-${index}`}
                >
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {resource.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {resource.reason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col space-y-2 px-6 py-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {resource.emergency && (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800"
                        >
                          {t("emergency")}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800"
                      >
                        {
                          RESOURCE_CATEGORY_CHOICES.find(
                            (o) => o.id === resource.category,
                          )?.text
                        }
                      </Badge>
                    </div>
                    <div className="flex flex-row gap-2">
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800"
                      >
                        {resource.origin_facility?.name}
                        <CareIcon
                          icon="l-arrow-right"
                          className="mx-2 size-4"
                        />
                        {resource.assigned_facility?.name}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col p-0">
                    <Separator className="my-2" />
                    <Link
                      href={`/facility/${resource.origin_facility.id}/resource/${resource.id}`}
                      className="items-center self-end pt-2 pr-4 pb-3 text-sm text-primary hover:underline text-right flex justify-end group-hover:translate-x-1 transition-transform"
                      data-cy={`resource-view-details-${index}`}
                    >
                      View Details
                      <CareIcon icon="l-arrow-right" className="ml-1 size-4" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
              {queryResources?.count &&
                queryResources.count > resultsPerPage && (
                  <div className="col-span-full">
                    <Pagination totalCount={queryResources.count} />
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
