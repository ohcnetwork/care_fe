import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
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
import { NavTabs } from "@/components/ui/nav-tabs";
import { ManageQueueOngoingTab } from "@/pages/Facility/queues/ManageQueueOngoingTab";
import QueueFormSheet from "@/pages/Facility/queues/QueueFormSheet";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Edit3, PowerOffIcon, SettingsIcon } from "lucide-react";
import { useNavigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

interface ManageQueuePageProps {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  queueId: string;
  tab: "ongoing" | "completed";
}

interface QueryParams {
  servicePoints?: string | null;
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

  const { data: queue, isLoading: isQueueLoading } = useQuery({
    queryKey: ["queue", facilityId, queueId],
    queryFn: query(tokenQueueApi.get, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  const { data: subQueues } = useQuery({
    queryKey: ["servicePoints", facilityId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
      },
    }),
  });

  const [qParams] = useQueryParams<QueryParams>();
  const servicePointIds = qParams.servicePoints?.split(",");

  const activeSubQueues =
    servicePointIds && subQueues?.results
      ? subQueues?.results.filter((subQueue) =>
          servicePointIds.includes(subQueue.id),
        )
      : subQueues?.results;

  if (isQueueLoading || !queue || !activeSubQueues || !subQueues) {
    // TODO: build appropriate loading skeleton...
    return <Loading />;
  }

  return (
    <Page title={queue.name} hideTitleOnPage>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <BackButton size="icon">
              <ChevronLeft />
            </BackButton>
            <h4 className="text-xl font-semibold">{queue.name}</h4>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SettingsIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ManageServicePointsDialog
                  subQueues={subQueues.results}
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
                <DropdownMenuItem className="text-red-600">
                  <PowerOffIcon className="mr-2 size-4 text-red-600" />
                  {t("end_queue")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <NavTabs
          tabs={{
            ongoing: {
              label: t("ongoing"),
              component: (
                <ManageQueueOngoingTab
                  facilityId={facilityId}
                  queueId={queueId}
                  resourceType={resourceType}
                  resourceId={resourceId}
                  subQueues={activeSubQueues}
                />
              ),
            },
            completed: {
              label: t("finished"),
              component: <div>Completed</div>,
            },
          }}
          currentTab={tab}
          onTabChange={(tab) => navigate(tab)}
        />
      </div>
    </Page>
  );
}

function ManageServicePointsDialog({
  trigger,
  subQueues,
  ...props
}: {
  trigger: React.ReactNode;
  subQueues: TokenSubQueueRead[];
} & React.ComponentProps<typeof Dialog>) {
  const { t } = useTranslation();
  const [qParams, setQParams] = useQueryParams<QueryParams>();
  const servicePointsIds =
    qParams.servicePoints?.split(",") ??
    subQueues.map((subQueue) => subQueue.id);

  const handleServicePointToggle = (subQueueId: string, checked: boolean) => {
    let updated = checked
      ? [...servicePointsIds, subQueueId]
      : servicePointsIds.filter((id) => id !== subQueueId);

    if (checked) {
      updated = [...new Set([...servicePointsIds, subQueueId])];
    } else {
      updated = servicePointsIds.filter((id) => id !== subQueueId);
    }

    if (updated.length > 0 && updated.length !== servicePointsIds.length) {
      setQParams({ servicePoints: updated.join(",") });
    } else {
      setQParams({ servicePoints: null });
    }
  };

  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("assigned_service_points")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {subQueues.map((subQueue) => {
            const isSelected = servicePointsIds.includes(subQueue.id);
            return (
              <div
                key={subQueue.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleServicePointToggle(subQueue.id, checked as boolean)
                    }
                  />
                  <span className="text-sm font-medium">{subQueue.name}</span>
                </div>
                <Badge variant={isSelected ? "primary" : "secondary"}>
                  {isSelected ? "Active" : "Inactive"}
                </Badge>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
