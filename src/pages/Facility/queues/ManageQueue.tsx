import { AnimatedCounter } from "@/components/Common/AnimatedCounter";
import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { ScheduleResourceIcon } from "@/components/Schedule/ScheduleResourceIcon";
import {
  resourceTypeToResourcePathSlug,
  useScheduleResource,
} from "@/components/Schedule/useScheduleResource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ManageQueueFinishedTab } from "@/pages/Facility/queues/ManageQueueFinishedTab";
import { ManageQueueOngoingTab } from "@/pages/Facility/queues/ManageQueueOngoingTab";
import QueueFormSheet from "@/pages/Facility/queues/QueueFormSheet";
import { useQueueServicePoints } from "@/pages/Facility/queues/useQueueServicePoints";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import { TokenStatus } from "@/types/tokens/token/token";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { ChevronLeft, Edit3, InfoIcon, SettingsIcon } from "lucide-react";
import { useNavigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { getTokenQueueStatusCount } from "./utils";

interface ManageQueuePageProps {
  facilityId: string;
  resourceId: string;
  resourceType: SchedulableResourceType;
  queueId: string;
  tab: "ongoing" | "completed";
}

export function ManageQueuePage({
  facilityId,
  queueId,
  resourceType,
  resourceId,
  tab,
}: ManageQueuePageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resource = useScheduleResource();
  const [{ autoRefresh }, setQueryParams] = useQueryParams<{
    autoRefresh: string;
  }>();
  const { data: queue, isLoading: isQueueLoading } = useQuery({
    queryKey: ["tokenQueue", facilityId, queueId],
    queryFn: query(tokenQueueApi.get, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  const { data: tokenData } = useQuery({
    queryKey: ["token-queue-summary", facilityId, queueId],
    queryFn: query(tokenQueueApi.summary, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  const onGoingCount = getTokenQueueStatusCount(
    tokenData ?? {},
    TokenStatus.UNFULFILLED,
    TokenStatus.CREATED,
    TokenStatus.IN_PROGRESS,
  );

  const finishedCount = getTokenQueueStatusCount(
    tokenData ?? {},
    TokenStatus.FULFILLED,
    TokenStatus.CANCELLED,
    TokenStatus.ENTERED_IN_ERROR,
  );

  if (isQueueLoading || !queue) {
    // TODO: build appropriate loading skeleton...
    return <Loading />;
  }

  return (
    <Page
      title={
        resource
          ? t("queue_of_resource", {
              resource: formatScheduleResourceName(resource),
            })
          : queue.name
      }
      hideTitleOnPage
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-between gap-3">
          <div className="flex gap-2 items-center">
            <BackButton
              // TODO: move queue index page for practitioner to similar pattern path
              to={
                resourceType === SchedulableResourceType.Practitioner
                  ? `/facility/${facilityId}/queues?date=${dateQueryString(queue.date)}&resource_id=${resourceId}`
                  : `/facility/${facilityId}/${resourceTypeToResourcePathSlug[resourceType]}/${resourceId}/queues?date=${dateQueryString(queue.date)}&resource_id=${resourceId}`
              }
              size="icon"
              variant="ghost"
            >
              <ChevronLeft />
            </BackButton>
            {resource && (
              <div className="flex items-center gap-2">
                <ScheduleResourceIcon resource={resource} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black">
                      {t("queue_of_resource", {
                        resource: formatScheduleResourceName(resource),
                      })}
                    </span>
                    {queue.is_primary && (
                      <Badge
                        variant={queue.is_primary ? "primary" : "secondary"}
                        className="hidden sm:block text-xs"
                      >
                        {t("primary")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {!queue.system_generated && `${queue.name} - `}
                    {formatDate(queue.date, "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-5 items-center justify-center">
            <div className="flex flex-col-reverse sm:flex-row gap-2 items-center text-black font-medium text-md">
              <Switch
                checked={autoRefresh === "true"}
                onCheckedChange={(checked) =>
                  setQueryParams({
                    autoRefresh: checked ? "true" : "false",
                  })
                }
              />
              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap">{t("auto_refresh")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild className="hidden sm:block">
                      <span className="cursor-help">
                        <InfoIcon className="size-4 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{t("auto_refresh_tooltip")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SettingsIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ManageServicePointsDialog
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <SettingsIcon className="mr-2 size-4" />
                      {t("manage_service_points")}
                    </DropdownMenuItem>
                  }
                />
                <QueueFormSheet
                  facilityId={facilityId}
                  resourceType={resourceType}
                  resourceId={resourceId}
                  queueId={queueId}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit3 className="mr-2 size-4" />
                      {t("edit_queue_name")}
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <NavTabs
          tabs={{
            ongoing: {
              label: t("ongoing"),
              labelSuffix: (
                <Badge variant="outline" className="px-2 py-1">
                  <AnimatedCounter count={onGoingCount} />
                </Badge>
              ),
              component: (
                <ManageQueueOngoingTab
                  facilityId={facilityId}
                  queueId={queueId}
                />
              ),
            },
            completed: {
              label: t("finished"),
              labelSuffix: (
                <Badge variant="outline" className="px-2 py-1">
                  <AnimatedCounter count={finishedCount} />
                </Badge>
              ),
              component: (
                <ManageQueueFinishedTab
                  facilityId={facilityId}
                  queueId={queueId}
                />
              ),
            },
          }}
          currentTab={tab}
          onTabChange={(tab) => {
            navigate(tab, {
              query: {
                autoRefresh,
              },
            });
          }}
          setPageTitle={false}
        />
      </div>
    </Page>
  );
}

function ManageServicePointsDialog({
  trigger,
  ...props
}: {
  trigger: React.ReactNode;
} & React.ComponentProps<typeof Dialog>) {
  const { t } = useTranslation();

  const { allServicePoints, assignedServicePointIds, toggleServicePoint } =
    useQueueServicePoints();

  if (!allServicePoints) {
    return <Loading />;
  }

  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("assigned_service_points")}</DialogTitle>
        </DialogHeader>
        <div>
          {allServicePoints.map((subQueue) => {
            const isSelected = assignedServicePointIds.includes(subQueue.id);
            return (
              <div
                key={subQueue.id}
                className="flex items-center justify-between rounded-sm w-full p-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  toggleServicePoint(subQueue.id, !isSelected);
                }}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      toggleServicePoint(subQueue.id, checked as boolean)
                    }
                  />
                  <span className="text-sm font-medium">{subQueue.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
