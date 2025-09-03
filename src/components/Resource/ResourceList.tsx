import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { RESOURCE_STATUS_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  getResourceRequestCategoryEnum,
  ResourceRequest,
} from "@/types/resourceRequest/resourceRequest";

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
  const { status, title, incoming } = qParams;

  const isActive = !status || !COMPLETED.includes(status);
  const currentStatuses = isActive ? ACTIVE : COMPLETED;

  // Set default status based on active/completed tab
  const defaultStatus = isActive ? "pending" : "completed";
  const currentStatus = status || defaultStatus;

  const { data: queryResources, isLoading } = useQuery({
    queryKey: ["resources", facilityId, qParams],
    queryFn: query.debounced(routes.listResourceRequests, {
      queryParams: {
        status: currentStatus,
        title,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        ...(!incoming
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
        <Badge className="bg-purple-50 text-purple-700 ml-2 rounded-xl px-3 py-0.5 m-3 w-max border-gray-200">
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
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 sm:pb-4 pb-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <SearchInput
                  data-cy="resource-search"
                  className="w-full sm:w-48"
                  options={[
                    {
                      key: "title",
                      type: "text",
                      placeholder: t("search_by_resource_title"),
                      value: title || "",
                      display: t("title"),
                    },
                  ]}
                  onFieldChange={() => updateQuery({ title: undefined })}
                  onSearch={(key, value) =>
                    updateQuery({ [key]: value || undefined })
                  }
                />
                <div>
                  <Tabs value={incoming ? "incoming" : "outgoing"}>
                    <TabsList className="inline-flex bg-transparent p-0 h-8 w-full">
                      <TabsTrigger
                        value="outgoing"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary w-full"
                        onClick={() => updateQuery({ incoming: false })}
                        data-cy="tab-outgoing"
                      >
                        {t("outgoing")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="incoming"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary w-full"
                        onClick={() => updateQuery({ incoming: true })}
                        data-cy="tab-incoming"
                      >
                        {t("incoming")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="sm:hidden block">
                  <Tabs value={isActive ? "active" : "completed"}>
                    <TabsList className="bg-transparent p-0 h-8 w-full">
                      <TabsTrigger
                        value="active"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary w-full"
                        onClick={() => updateQuery({ status: "pending" })}
                      >
                        {t("active")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary w-full"
                        onClick={() => updateQuery({ status: "completed" })}
                      >
                        {t("completed")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="hidden sm:block">
                <Tabs value={isActive ? "active" : "completed"}>
                  <TabsList className="bg-transparent p-0 h-8">
                    <TabsTrigger
                      value="active"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() => updateQuery({ status: "pending" })}
                    >
                      {t("active")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() => updateQuery({ status: "completed" })}
                    >
                      {t("completed")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Separator className="hidden sm:block" />

            <div className="p-4 h-auto overflow-hidden">
              <div className="block sm:hidden w-full">
                <Select
                  value={currentStatus}
                  onValueChange={(value) => updateQuery({ status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentStatuses.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {t(`resource_status__${statusOption}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Tabs */}
              <Tabs value={currentStatus} className="hidden sm:block w-full">
                <TabsList className="bg-transparent p-0 h-auto flex-wrap justify-start gap-y-2 overflow-auto">
                  {currentStatuses.map((statusOption) => (
                    <TabsTrigger
                      key={statusOption}
                      value={statusOption}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      data-cy={`tab-${statusOption}`}
                      onClick={() => updateQuery({ status: statusOption })}
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
                        <Badge variant="destructive">{t("emergency")}</Badge>
                      )}
                      <Badge variant="secondary">
                        {t(
                          `resource_request_category__${getResourceRequestCategoryEnum(resource.category)}`,
                        )}
                      </Badge>
                    </div>
                    <div className="flex flex-row gap-2">
                      <Badge variant="secondary">
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
                      {t("view_details")}
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
