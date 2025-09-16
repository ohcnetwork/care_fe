import { useQuery } from "@tanstack/react-query";
import { Edit, MoreVertical, Pencil, Plus, Square, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
import { startOfDay } from "date-fns";
import dayjs from "dayjs";
import { Link } from "raviger";
import QueueFormSheet from "./QueueFormSheet";
import SubQueueFormSheet from "./SubQueueFormSheet";

interface QueueRowProps {
  queue: TokenQueueRead;
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  index: number;
}

function QueueRow({
  queue,
  facilityId,
  resourceType,
  resourceId,
  index,
}: QueueRowProps) {
  const { t } = useTranslation();
  const queueLink =
    resourceType === SchedulableResourceType.Practitioner
      ? `/facility/${facilityId}/queues/${queue.id}/${resourceType}/${resourceId}/ongoing`
      : `/queues/${queue.id}/ongoing`;

  return (
    <TableRow className="hover:bg-gray-200">
      <TableCell className="font-medium text-gray-700 w-12 border-r border-gray-200 bg-white">
        {index + 1}
      </TableCell>
      <TableCell className="border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Link href={queueLink} className="font-medium underline">
              {queue.name}
            </Link>
            {queue.is_primary && (
              <Badge
                variant="secondary"
                className="text-xs bg-purple-100 text-purple-800"
              >
                {t("primary")}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            asChild
          >
            <Link href={queueLink}>{t("open")}</Link>
          </Button>
        </div>
      </TableCell>
      <TableCell className="border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
          >
            {t("active")}
          </Button>
        </div>
      </TableCell>
      <TableCell className="w-12 border-r border-gray-200 bg-white rounded-r-md">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border border-gray-200">
            <DropdownMenuItem asChild>
              <Link href={queueLink} className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                {t("open_queue_board")}
              </Link>
            </DropdownMenuItem>
            <QueueFormSheet
              facilityId={facilityId}
              resourceType={resourceType}
              resourceId={resourceId}
              queueId={queue.id}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("edit_queue_name")}
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              <X className="h-4 w-4 mr-2" />
              {t("end_queue")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
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
    <Card className="hover:shadow-md transition-all bg-gray-50 duration-200 border-gray-200 shadow-none rounded-sm border-gray-200">
      <CardContent className="py-1 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base text-gray-900 truncate">
                {subQueue.name}
              </h3>
            </div>
          </div>

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
  const isPast = dayjs(qParams.date).isBefore(dayjs(), "day");

  return (
    <Page title={t("token_queues")} hideTitleOnPage>
      <div className="container mx-auto px-4 py-6">
        {/* Header Section - Date, Practitioner, Create Queue */}
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
                {t("selected_practitioner")}
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

          {/* Create Queue Button */}
          <div className="ml-auto">
            <QueueFormSheet
              facilityId={facilityId}
              resourceType={resourceType}
              resourceId={effectiveResourceId}
              initialDate={startOfDay(qParams.date)}
              trigger={
                <Button size="sm" className="font-bold" disabled={isPast}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("create_queue")}
                </Button>
              }
            />
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Queues Section - Takes up 2/3 of the width */}
          <div className="xl:col-span-2">
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
                    initialDate={startOfDay(qParams.date)}
                    trigger={
                      <Button disabled={isPast}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("create_first_queue")}
                      </Button>
                    }
                  />
                }
              />
            ) : (
              <div className="overflow-hidden">
                <Table className="p-0">
                  <TableHeader className="bg-gray-100">
                    <TableRow className="rounded-md">
                      <TableHead className="w-12 border-r border-gray-200 text-gray-700">
                        #
                      </TableHead>
                      <TableHead className="border-r border-gray-200 text-gray-700">
                        {t("queue_title")}
                      </TableHead>
                      <TableHead className="w-16 border-r border-gray-200 text-gray-700">
                        {t("status")}
                      </TableHead>
                      <TableHead className="w-12 border-r border-gray-200 text-gray-700">
                        {t("settings")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.map((queue, index) => (
                      <QueueRow
                        key={queue.id}
                        queue={queue}
                        facilityId={facilityId}
                        resourceType={resourceType}
                        resourceId={effectiveResourceId}
                        index={index}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Service Points Section - Takes up 1/3 of the width */}
          <div className="bg-white rounded-lg border border-gray-200 p-2 shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-base font-medium text-gray-900">
                    {t("service_points")} - {subQueues.length}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <SubQueueFormSheet
                  facilityId={facilityId}
                  resourceType={resourceType}
                  resourceId={effectiveResourceId}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
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
