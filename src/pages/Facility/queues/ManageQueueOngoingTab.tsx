import { useScheduleResourceFromPath } from "@/components/Schedule/useScheduleResource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OngoingQueueTokenCardsList } from "@/pages/Facility/queues/OngoingQueueTokenCard";
import { usePreferredServicePointCategory } from "@/pages/Facility/queues/usePreferredServicePointCategory";
import { getTokenQueueStatusCount } from "@/pages/Facility/queues/utils";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpenIcon, EyeIcon, Megaphone, SettingsIcon } from "lucide-react";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ServicePointsDropDown } from "./ServicePointsDropDown";
import { useQueueServicePoints } from "./useQueueServicePoints";

interface Props {
  facilityId: string;
  queueId: string;
}

export function ManageQueueOngoingTab({ facilityId, queueId }: Props) {
  const { t } = useTranslation();
  const { assignedServicePoints } = useQueueServicePoints();
  const { preferredServicePointCategories } = usePreferredServicePointCategory({
    facilityId,
  });
  const [{ autoRefresh }] = useQueryParams();
  const { data: summary } = useQuery({
    queryKey: ["token-queue-summary", facilityId, queueId],
    queryFn: query(tokenQueueApi.summary, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
    refetchInterval: autoRefresh === "true" ? 10000 : false,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 mt-4">
        <Label className="text-gray-950 text-sm font-medium">
          {t("service_points")}
        </Label>
        <ServicePointsDropDown />
      </div>
      <div className="flex space-x-4 overflow-x-auto w-full">
        {/* Waiting tokens list */}
        <QueueColumn title={t("waiting")}>
          <OngoingQueueTokenCardsList
            facilityId={facilityId}
            queueId={queueId}
            qParams={{
              sub_queue_is_null: true,
              status: TokenStatus.CREATED,
            }}
            emptyState={
              <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-10 border border-gray-100">
                <DoorOpenIcon className="size-6 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">
                  {t("no_patient_is_waiting")}
                </span>
              </div>
            }
          />
        </QueueColumn>

        {/* Called + Now Serving tokens list */}
        <QueueColumn
          title={t("called_plus_now_serving")}
          options={
            summary && (
              <AwaitingRecallTrigger
                queueId={queueId}
                facilityId={facilityId}
                count={getTokenQueueStatusCount(
                  summary,
                  TokenStatus.UNFULFILLED,
                )}
              />
            )
          }
        >
          <div className="flex flex-col gap-4">
            {assignedServicePoints.map((subQueue, index) => (
              <>
                {index > 0 && (
                  <hr className="h-px w-full border border-gray-300 border-dashed" />
                )}
                <div className="flex flex-col p-1 rounded-lg bg-gray-200">
                  <div className="flex items-center justify-between p-1 pb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {subQueue.name}
                      </span>
                      <span className="text-xs">
                        {t("category")}:{" "}
                        {preferredServicePointCategories?.[subQueue.id]?.name ??
                          t("all")}
                      </span>
                    </div>
                    <InServiceColumnOptions
                      facilityId={facilityId}
                      queueId={queueId}
                      subQueueId={subQueue.id}
                      tokens={[]}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 pt-2">
                      <span className="text-sm font-medium">
                        {t("now_serving")}
                      </span>
                      <OngoingQueueTokenCardsList
                        facilityId={facilityId}
                        queueId={queueId}
                        qParams={{
                          status: TokenStatus.IN_PROGRESS,
                          sub_queue: subQueue.id,
                        }}
                        emptyState={
                          <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-3 border border-gray-100">
                            <DoorOpenIcon className="size-6 text-gray-700" />
                            <span className="text-sm font-semibold text-gray-700">
                              {t("no_patient_is_being_served")}
                            </span>
                            <CallNextPatientButton
                              subQueueId={subQueue.id}
                              facilityId={facilityId}
                              queueId={queueId}
                              variant="outline"
                              size="lg"
                            >
                              <Megaphone />
                              {t("call_next_patient")}
                            </CallNextPatientButton>
                          </div>
                        }
                      />
                    </div>
                    <OngoingQueueTokenCardsList
                      facilityId={facilityId}
                      queueId={queueId}
                      qParams={{
                        status: TokenStatus.CREATED,
                        sub_queue: subQueue.id,
                      }}
                      header={
                        <div className="border border-gray-300 border-dashed" />
                      }
                    />
                  </div>
                </div>
              </>
            ))}
          </div>
        </QueueColumn>
      </div>
    </div>
  );
}

export function QueueColumn({
  title,
  children,
  options,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  options?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200 min-w-xs flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {options}
      </div>
      <div className="h-[calc(100vh-21.5rem)] overflow-y-auto pb-2">
        {children}
      </div>
    </div>
  );
}

function InServiceColumnOptions({
  facilityId,
  queueId,
  subQueueId,
}: {
  facilityId: string;
  queueId: string;
  subQueueId: string;
  tokens: TokenRead[];
}) {
  const { t } = useTranslation();

  const { preferredServicePointCategories, setPreferredServicePointCategory } =
    usePreferredServicePointCategory({ facilityId });
  const { resourceType } = useScheduleResourceFromPath();

  const { data: tokenCategories } = useQuery({
    queryKey: ["tokenCategories", facilityId, resourceType],
    queryFn: query(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
      },
    }),
  });

  return (
    <div className="flex gap-1">
      <CallNextPatientButton
        subQueueId={subQueueId}
        facilityId={facilityId}
        queueId={queueId}
        variant="ghost"
        size="icon"
      >
        <Megaphone />
      </CallNextPatientButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <SettingsIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t("set_category")}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <RadioGroup
                value={
                  preferredServicePointCategories?.[subQueueId]?.id || "all"
                }
                onValueChange={(value) =>
                  setPreferredServicePointCategory(
                    subQueueId,
                    value === "all" ? null : value,
                  )
                }
                className="space-y-2 p-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    {t("all")}
                  </Label>
                </div>
                {tokenCategories?.results.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={category.id} id={category.id} />
                    <Label htmlFor={category.id} className="cursor-pointer">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {/* <DropdownMenuItem>Transfer all</DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AwaitingRecallTrigger({
  count,
  queueId,
  facilityId,
}: {
  count: number;
  queueId: string;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const [showAwaitingRecallDialog, setShowAwaitingRecallDialog] =
    useState(false);

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="link"
          size="lg"
          className="underline font-semibold"
          disabled={count === 0}
          onClick={() => setShowAwaitingRecallDialog(true)}
        >
          <EyeIcon />
          <span>{t("awaiting_recall")}</span>
        </Button>
        <div>
          <Badge size="sm">{count}</Badge>
        </div>
      </div>
      <AwaitingRecallDialog
        open={showAwaitingRecallDialog}
        onOpenChange={setShowAwaitingRecallDialog}
        facilityId={facilityId}
        queueId={queueId}
      />
    </>
  );
}

function CallNextPatientButton({
  subQueueId,
  facilityId,
  queueId,
  ...props
}: {
  subQueueId: string;
  facilityId: string;
  queueId: string;
} & React.ComponentProps<typeof Button>) {
  const { preferredServicePointCategories } = usePreferredServicePointCategory({
    facilityId,
  });

  const queryClient = useQueryClient();

  const {
    mutate: setNextTokenToSubQueue,
    isPending: isSettingNextTokenToSubQueue,
  } = useMutation({
    mutationFn: mutate(tokenQueueApi.setNextTokenToSubQueue, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, queueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
    },
  });

  return (
    <Button
      {...props}
      disabled={isSettingNextTokenToSubQueue}
      onClick={() => {
        setNextTokenToSubQueue({
          sub_queue: subQueueId,
          category: preferredServicePointCategories?.[subQueueId]?.id,
        });
      }}
    />
  );
}

function AwaitingRecallDialog({
  open,
  onOpenChange,
  facilityId,
  queueId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  queueId: string;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("awaiting_recall")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <OngoingQueueTokenCardsList
            facilityId={facilityId}
            queueId={queueId}
            qParams={{
              status: TokenStatus.UNFULFILLED,
            }}
            emptyState={
              <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-10 border border-gray-100">
                <EyeIcon className="size-6 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">
                  {t("no_tokens_awaiting_recall")}
                </span>
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
