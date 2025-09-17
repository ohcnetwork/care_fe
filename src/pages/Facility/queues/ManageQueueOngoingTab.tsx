import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  DoorOpenIcon,
  Megaphone,
  MoreHorizontal,
  RotateCcw,
  SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  subQueues: TokenSubQueueRead[];
}

export function ManageQueueOngoingTab({
  facilityId,
  queueId,
  subQueues,
  resourceType,
}: Props) {
  const { t } = useTranslation();
  const { data: summary } = useQuery({
    queryKey: ["token-queue-summary", facilityId, queueId],
    queryFn: query(tokenQueueApi.summary, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex space-x-4 overflow-x-auto w-full">
        {/* Waiting tokens list */}
        <QueueColumn
          title={t("waiting")}
          count={
            summary && (
              <Badge size="sm">
                {getTokenQueueStatusCount(summary, TokenStatus.CREATED)}
              </Badge>
            )
          }
        >
          <OngoingQueueTokenCardsList
            facilityId={facilityId}
            queueId={queueId}
            status={TokenStatus.CREATED}
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
          count={
            summary && (
              <Badge size="sm">
                {getTokenQueueStatusCount(
                  summary,
                  TokenStatus.CREATED,
                  TokenStatus.IN_PROGRESS,
                )}
              </Badge>
            )
          }
        >
          <div className="flex flex-col gap-4">
            {subQueues.map((subQueue, index) => (
              <>
                {index > 0 && (
                  <hr className="h-px w-full border border-gray-300 border-dashed" />
                )}
                <SubQueueColumn
                  key={subQueue.id}
                  resourceType={resourceType}
                  subQueue={subQueue}
                  facilityId={facilityId}
                  queueId={queueId}
                  status={TokenStatus.IN_PROGRESS}
                  emptyState={
                    <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-3 border border-gray-100">
                      <DoorOpenIcon className="size-6 text-gray-700" />
                      <span className="text-sm font-semibold text-gray-700">
                        {t("no_patient_is_being_called")}
                      </span>
                      <CallNextPatientButton
                        subQueueId={subQueue.id}
                        facilityId={facilityId}
                        resourceType={resourceType}
                        queueId={queueId}
                        variant="outline"
                        size="lg"
                      >
                        <Megaphone />
                        {t("call_next_patient")}
                      </CallNextPatientButton>
                    </div>
                  }
                  options={(tokens) => (
                    <InServiceColumnOptions
                      facilityId={facilityId}
                      resourceType={resourceType}
                      queueId={queueId}
                      subQueueId={subQueue.id}
                      tokens={tokens}
                    />
                  )}
                  tokenOptions={(token) => (
                    <InServiceTokenOptions
                      token={token}
                      facilityId={facilityId}
                      queueId={queueId}
                    />
                  )}
                />
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
  count,
  children,
}: {
  title: React.ReactNode;
  count: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200 min-w-xs flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{title}</span>
          {count}
        </div>
      </div>
      <div className="h-[calc(100vh-15rem)] overflow-y-auto pb-2">
        {children}
      </div>
    </div>
  );
}

function SubQueueColumn({
  facilityId,
  queueId,
  subQueue,
  resourceType,
  status,
  emptyState,
  options,
}: {
  facilityId: string;
  queueId: string;
  subQueue: TokenSubQueueRead;
  resourceType: SchedulableResourceType;
  status: TokenStatus;
  emptyState: React.ReactNode;
  options?: (tokens: TokenRead[]) => React.ReactNode;
  tokenOptions?: (token: TokenRead) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const { preferredServicePointCategory } = usePreferredServicePointCategory({
    facilityId,
    subQueueId: subQueue.id,
    resourceType,
  });

  return (
    <div className="flex flex-col p-1 rounded-lg bg-gray-200">
      <div className="flex items-center justify-between p-1 pb-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{subQueue.name}</span>
          <span className="text-xs">
            {t("category")}: {preferredServicePointCategory?.name ?? t("all")}
          </span>
        </div>
        {options?.([])}
      </div>
      <OngoingQueueTokenCardsList
        facilityId={facilityId}
        queueId={queueId}
        subQueueId={subQueue.id}
        status={status}
        emptyState={emptyState}
      />
    </div>
  );
}

function InServiceColumnOptions({
  facilityId,
  resourceType,
  queueId,
  subQueueId,
  tokens,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
  queueId: string;
  subQueueId: string;
  tokens: TokenRead[];
}) {
  const { t } = useTranslation();
  const [showCompleteAllDialog, setShowCompleteAllDialog] = useState(false);

  const queryClient = useQueryClient();

  const { preferredServicePointCategory, setPreferredServicePointCategory } =
    usePreferredServicePointCategory({ facilityId, subQueueId, resourceType });

  const { data: tokenCategories } = useQuery({
    queryKey: ["tokenCategories", facilityId, resourceType],
    queryFn: query(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
      },
    }),
  });

  const { mutate: completeAllTokens, isPending: isCompletingAllTokens } =
    useMutation({
      mutationFn: mutate(tokenApi.upsert, {
        pathParams: { facility_id: facilityId, queue_id: queueId },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "infinite-tokens",
            facilityId,
            queueId,
            { sub_queue: subQueueId, status: TokenStatus.IN_PROGRESS },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "infinite-tokens",
            facilityId,
            queueId,
            { status: TokenStatus.FULFILLED },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: ["token-queue-summary", facilityId, queueId],
        });
        setShowCompleteAllDialog(false);
      },
    });

  const handleCompleteAllTokens = () => {
    completeAllTokens({
      datapoints: tokens.map((token) => ({
        id: token.id,
        status: TokenStatus.FULFILLED,
        note: token.note,
        sub_queue: undefined,
      })),
    });
  };

  return (
    <div className="flex gap-1">
      <CallNextPatientButton
        subQueueId={subQueueId}
        facilityId={facilityId}
        resourceType={resourceType}
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
                value={preferredServicePointCategory?.id || "all"}
                onValueChange={(value) =>
                  setPreferredServicePointCategory(
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
          <DropdownMenuItem onClick={() => setShowCompleteAllDialog(true)}>
            {t("complete_all")}
          </DropdownMenuItem>
          {/* <DropdownMenuItem>Transfer all</DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={showCompleteAllDialog}
        onOpenChange={setShowCompleteAllDialog}
        title={t("complete_all_tokens")}
        description={t("complete_all_tokens_confirmation")}
        onConfirm={handleCompleteAllTokens}
        cancelText={t("cancel")}
        confirmText={t("complete_all")}
        variant="primary"
        disabled={isCompletingAllTokens}
      />
    </div>
  );
}

function TokenCompleteConfirmDialog({
  open,
  onOpenChange,
  token,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("complete_token")}
      description={t("complete_token_confirmation", {
        patientName: token.patient?.name,
        tokenNumber: `${token.category.shorthand}-${token.number.toString().padStart(3, "0")}`,
      })}
      onConfirm={onConfirm}
      cancelText={t("cancel")}
      confirmText={t("complete_token")}
      variant="primary"
      disabled={isLoading}
    />
  );
}

function InServiceTokenOptions({
  token,
  facilityId,
  queueId,
}: {
  token: TokenRead;
  facilityId: string;
  queueId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const { mutate: updateToken, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { sub_queue: token.sub_queue?.id, status: TokenStatus.IN_PROGRESS },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.FULFILLED },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CANCELLED },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CREATED },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
      setShowCompleteDialog(false);
    },
  });

  const handleCompleteToken = () => {
    updateToken({
      status: TokenStatus.FULFILLED,
      note: token.note,
      sub_queue: undefined,
    });
  };

  const handleMoveBackToWaiting = () => {
    updateToken({
      status: TokenStatus.CREATED,
      note: token.note,
      sub_queue: undefined,
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Complete button */}
        <Button
          variant="outline_primary"
          size="icon"
          onClick={() => setShowCompleteDialog(true)}
          disabled={isUpdating}
          title={t("complete_token")}
        >
          <Check />
        </Button>

        {/* Dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleMoveBackToWaiting}
              disabled={isUpdating}
            >
              <RotateCcw className="size-4" />
              {t("move_back_to_waiting")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TokenCompleteConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        token={token}
        onConfirm={handleCompleteToken}
        isLoading={isUpdating}
      />
    </>
  );
}

function CallNextPatientButton({
  subQueueId,
  facilityId,
  queueId,
  resourceType,
  ...props
}: {
  subQueueId: string;
  facilityId: string;
  resourceType: SchedulableResourceType;
  queueId: string;
} & React.ComponentProps<typeof Button>) {
  const { preferredServicePointCategory } = usePreferredServicePointCategory({
    facilityId,
    subQueueId,
    resourceType,
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
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.IN_PROGRESS },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CREATED },
        ],
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
          category: preferredServicePointCategory?.id,
        });
      }}
    />
  );
}
