import { useQuery } from "@tanstack/react-query";
import { Calendar, Edit, MapPin, Plus } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import useAuthUser from "@/hooks/useAuthUser";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { TokenQueueRead } from "@/types/tokens/tokenQueue/tokenQueue";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import { UserReadMinimal } from "@/types/user/user";

import { dateQueryString } from "@/Utils/utils";
import QueueFormSheet from "./QueueFormSheet";
import SubQueueFormSheet from "./SubQueueFormSheet";

interface QueueCardProps {
  queue: TokenQueueRead;
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
}

function QueueCard({
  queue,
  facilityId,
  resourceType,
  resourceId,
}: QueueCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-gray-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {queue.name}
                </h3>
                {queue.set_is_primary && (
                  <Badge variant="primary" className="text-xs">
                    {t("primary")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(queue.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="green"
              className="bg-green-50 text-green-700 border-green-200"
            >
              {t("active")}
            </Badge>
            <QueueFormSheet
              facilityId={facilityId}
              resourceType={resourceType}
              resourceId={resourceId}
              queueId={queue.id}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("edit")}</span>
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SubQueueCardProps {
  subQueue: TokenSubQueueRead;
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
}

function SubQueueCard({
  subQueue,
  facilityId,
  resourceType,
  resourceId,
}: SubQueueCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-gray-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {subQueue.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="green"
              className="bg-green-50 text-green-700 border-green-200"
            >
              {t("active")}
            </Badge>
            <SubQueueFormSheet
              facilityId={facilityId}
              resourceType={resourceType}
              resourceId={resourceId}
              subQueueId={subQueue.id}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("edit")}</span>
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QueuesIndex({
  facilityId,
  resourceType,
  resourceId,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    disableCache: true,
  });

  const { id: currentUserId } = useAuthUser();

  // Set default resourceId for practitioners
  const effectiveResourceId =
    qParams.resource_id ||
    resourceId ||
    (resourceType === SchedulableResourceType.Practitioner
      ? currentUserId.toString()
      : undefined);

  // Fetch available users for practitioner resource type
  const { data: availableUsersData } = useQuery({
    queryKey: ["availableUsers", facilityId],
    queryFn: query(scheduleApi.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
    enabled: resourceType === SchedulableResourceType.Practitioner,
  });

  const availableUsers = availableUsersData?.users || [];

  // Set default date to today if no date is specified
  useEffect(() => {
    if (!qParams.date) {
      const today = new Date();
      updateQuery({ date: dateQueryString(today) });
    }
  }, [qParams.date, updateQuery]);

  // Handle date filter
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      updateQuery({ date: dateQueryString(date) });
    } else {
      updateQuery({ date: undefined });
    }
  };

  // Handle resource selection
  const handleResourceChange = (selectedResourceId: string) => {
    updateQuery({ resource_id: selectedResourceId });
  };

  // Fetch queues
  const { data: queuesResponse, isLoading: queuesLoading } = useQuery({
    queryKey: ["tokenQueues", facilityId, effectiveResourceId, qParams],
    queryFn: query(tokenQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: effectiveResourceId,
        date: qParams.date,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
  });

  // Fetch sub-queues (service points)
  const { data: subQueuesResponse, isLoading: subQueuesLoading } = useQuery({
    queryKey: ["tokenSubQueues", facilityId, effectiveResourceId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: effectiveResourceId,
      },
    }),
  });

  const queues = queuesResponse?.results || [];
  const subQueues = subQueuesResponse?.results || [];

  // Get the selected date for dynamic title
  const selectedDate = qParams.date ? new Date(qParams.date) : new Date();
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const queueTitle = isToday
    ? t("todays_queues")
    : t("queues_for_date", { date: selectedDate.toLocaleDateString() });

  return (
    <Page title={t("token_queues")} hideTitleOnPage>
      <div className="container mx-auto px-4 py-6">
        {/* Filters Section */}
        <div className="mb-8 flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border border-gray-200">
          {/* Date Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t("date")}
            </label>
            <DatePicker
              date={qParams.date ? new Date(qParams.date) : undefined}
              onChange={handleDateChange}
            />
          </div>

          {/* Resource Picker - Only show for Practitioner resource type */}
          {resourceType === SchedulableResourceType.Practitioner && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t("practitioner")}
              </label>
              <Select
                value={qParams.resource_id || effectiveResourceId}
                onValueChange={handleResourceChange}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={t("select_practitioner")} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user: UserReadMinimal) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Queues Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {queueTitle}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {queues.length} {t("queues_active_today")}
                  </p>
                </div>
              </div>
              <QueueFormSheet
                facilityId={facilityId}
                resourceType={resourceType}
                resourceId={effectiveResourceId}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("create_queue")}
                  </Button>
                }
              />
            </div>

            {queuesLoading ? (
              <div className="space-y-3">
                <CardListSkeleton count={3} />
              </div>
            ) : queues.length === 0 ? (
              <EmptyState
                icon="l-folder-open"
                title={t("no_queues_found")}
                description={t("no_queues_found_description")}
                action={
                  <QueueFormSheet
                    facilityId={facilityId}
                    resourceType={resourceType}
                    resourceId={effectiveResourceId}
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("create_first_queue")}
                      </Button>
                    }
                  />
                }
              />
            ) : (
              <div className="space-y-3">
                {queues.map((queue) => (
                  <QueueCard
                    key={queue.id}
                    queue={queue}
                    facilityId={facilityId}
                    resourceType={resourceType}
                    resourceId={effectiveResourceId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Service Points Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t("service_points")}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {subQueues.length} {t("service_points_available")}
                  </p>
                </div>
              </div>
              <SubQueueFormSheet
                facilityId={facilityId}
                resourceType={resourceType}
                resourceId={effectiveResourceId}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add_point")}
                  </Button>
                }
              />
            </div>

            {subQueuesLoading ? (
              <div className="space-y-3">
                <CardListSkeleton count={4} />
              </div>
            ) : subQueues.length === 0 ? (
              <EmptyState
                icon="l-map-pin"
                title={t("no_service_points_found")}
                description={t("no_service_points_found_description")}
                action={
                  <SubQueueFormSheet
                    facilityId={facilityId}
                    resourceType={resourceType}
                    resourceId={effectiveResourceId}
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("add_first_service_point")}
                      </Button>
                    }
                  />
                }
              />
            ) : (
              <div className="space-y-3">
                {subQueues.map((subQueue) => (
                  <SubQueueCard
                    key={subQueue.id}
                    subQueue={subQueue}
                    facilityId={facilityId}
                    resourceType={resourceType}
                    resourceId={effectiveResourceId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination for queues */}
        {queuesResponse && queuesResponse.count > resultsPerPage && (
          <div className="mt-8 flex justify-center">
            <Pagination totalCount={queuesResponse.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
