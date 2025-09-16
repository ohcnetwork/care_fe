import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
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
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferredServicePointCategory } from "@/pages/Facility/queues/usePreferredServicePointCategory";
import { getTokenQueueStatusCount } from "@/pages/Facility/queues/utils";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Check,
  DoorOpenIcon,
  ExternalLink,
  Megaphone,
  MoreHorizontal,
  RotateCcw,
  SettingsIcon,
  UserCheck,
  X,
} from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

interface Props {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  subQueues: TokenSubQueueRead[];
}

export function ManageQueueOngoingTab({
  facilityId,
  queueId,
  subQueues,
  resourceType,
  resourceId,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex space-x-4 overflow-x-auto w-full">
        <WaitingTokensColumn
          facilityId={facilityId}
          queueId={queueId}
          resourceType={resourceType}
          resourceId={resourceId}
          subQueues={subQueues}
        />
        <InServiceTokensColumn
          facilityId={facilityId}
          queueId={queueId}
          resourceType={resourceType}
          subQueues={subQueues}
        />
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

const PAGE_SIZE = 50;

function SubQueueColumn({
  facilityId,
  queueId,
  subQueue,
  resourceType,
  status,
  emptyState,
  options,
  tokenOptions,
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
  const { ref, inView } = useInView();
  const { preferredServicePointCategory } = usePreferredServicePointCategory({
    facilityId,
    subQueueId: subQueue.id,
    resourceType,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "infinite-tokens",
        facilityId,
        queueId,
        { sub_queue: subQueue.id, status },
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(tokenApi.list, {
          pathParams: { facility_id: facilityId, queue_id: queueId },
          queryParams: {
            sub_queue: subQueue.id,
            status,
            limit: PAGE_SIZE,
            offset: pageParam,
          },
        })({ signal });
        return response;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * PAGE_SIZE;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const tokens = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="flex flex-col p-1 rounded-lg bg-gray-200">
      <div className="flex items-center justify-between p-1 pb-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{subQueue.name}</span>
          <span className="text-xs">
            {t("category")}: {preferredServicePointCategory?.name ?? t("all")}
          </span>
        </div>
        {options?.(tokens)}
      </div>
      <div className="flex flex-col gap-3">
        {tokens.length > 0
          ? tokens.map((token, index) => (
              <div
                key={token.id}
                ref={index === tokens.length - 1 ? ref : undefined}
              >
                <TokenCard
                  facilityId={facilityId}
                  token={token}
                  options={tokenOptions?.(token)}
                />
              </div>
            ))
          : emptyState}
        {isFetchingNextPage && <TokenCardSkeleton count={5} />}
      </div>
    </div>
  );
}

function WaitingTokensColumn({
  facilityId,
  queueId,
  resourceType,
  resourceId,
  subQueues,
}: {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  subQueues: TokenSubQueueRead[];
}) {
  const { ref, inView } = useInView();

  const { data: summary } = useQuery({
    queryKey: ["token-queue-summary", facilityId, queueId],
    queryFn: query(tokenQueueApi.summary, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "infinite-tokens",
        facilityId,
        queueId,
        { status: TokenStatus.CREATED },
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(tokenApi.list, {
          pathParams: { facility_id: facilityId, queue_id: queueId },
          queryParams: {
            status: TokenStatus.CREATED,
            limit: PAGE_SIZE,
            offset: pageParam,
          },
        })({ signal });
        return response;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * PAGE_SIZE;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const tokens = data?.pages.flatMap((page) => page.results) ?? [];
  const { t } = useTranslation();
  return (
    <QueueColumn
      title={t("waiting")}
      count={
        summary && (
          <Badge size="sm" variant="blue">
            {getTokenQueueStatusCount(summary, TokenStatus.CREATED)}
          </Badge>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {tokens.length > 0 ? (
          tokens.map((token, index) => (
            <div
              key={token.id}
              ref={index === tokens.length - 1 ? ref : undefined}
            >
              <TokenCard
                facilityId={facilityId}
                token={token}
                options={
                  <WaitingTokenOptions
                    token={token}
                    facilityId={facilityId}
                    queueId={queueId}
                    _resourceType={resourceType}
                    _resourceId={resourceId}
                    subQueues={subQueues}
                  />
                }
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-10 border border-gray-100">
            <DoorOpenIcon className="size-6 text-gray-700" />
            <span className="text-sm font-semibold text-gray-700">
              {t("no_patient_is_waiting")}
            </span>
          </div>
        )}
        {isFetchingNextPage && <TokenCardSkeleton count={5} />}
      </div>
    </QueueColumn>
  );
}
function InServiceTokensColumn({
  facilityId,
  queueId,
  resourceType,
  subQueues,
}: {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  subQueues: TokenSubQueueRead[];
}) {
  const { t } = useTranslation();

  const { data: summary } = useQuery({
    queryKey: ["token-queue-summary", facilityId, queueId],
    queryFn: query(tokenQueueApi.summary, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  return (
    <QueueColumn
      title={t("in_service")}
      count={
        summary && (
          <Badge size="sm" variant="green">
            {getTokenQueueStatusCount(summary, TokenStatus.IN_PROGRESS)}
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

function TokenCancelConfirmDialog({
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
      title={t("cancel_token")}
      description={t("cancel_token_confirmation", {
        patientName: token.patient?.name,
        tokenNumber: renderTokenNumber(token),
      })}
      onConfirm={onConfirm}
      cancelText={t("cancel")}
      confirmText={t("cancel_token")}
      variant="destructive"
      disabled={isLoading}
    />
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

function AssignToServicePointDialog({
  open,
  onOpenChange,
  token,
  subQueues,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
  subQueues: TokenSubQueueRead[];
  onConfirm: (subQueueId: string) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>("");

  const handleConfirm = () => {
    if (selectedSubQueueId) {
      onConfirm(selectedSubQueueId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("select_service_point")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("choose_service_point_to_call_patient", {
              patientName: token.patient?.name,
              tokenNumber: renderTokenNumber(token),
            })}
          </p>
          <RadioGroup
            value={selectedSubQueueId}
            onValueChange={setSelectedSubQueueId}
            className="space-y-3"
          >
            {subQueues.map((subQueue) => (
              <div
                key={subQueue.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={subQueue.id} id={subQueue.id} />
                <label
                  htmlFor={subQueue.id}
                  className="flex-1 text-sm font-medium cursor-pointer"
                >
                  {subQueue.name}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex">
          <Button
            onClick={handleConfirm}
            className="w-full"
            disabled={!selectedSubQueueId || isLoading}
          >
            <UserCheck className="size-4 mr-2" />
            {t("call_patient")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WaitingTokenOptions({
  token,
  facilityId,
  queueId,
  _resourceType,
  _resourceId,
  subQueues,
}: {
  token: TokenRead;
  facilityId: string;
  queueId: string;
  _resourceType: SchedulableResourceType;
  _resourceId: string;
  subQueues: TokenSubQueueRead[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

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
          { status: TokenStatus.CREATED },
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
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.IN_PROGRESS },
        ],
      });
      setShowCancelDialog(false);
      setShowAssignDialog(false);
    },
  });

  const handleCancelToken = () => {
    updateToken({
      status: TokenStatus.CANCELLED,
      note: token.note,
    });
  };

  const handleAssignToServicePoint = (subQueueId: string) => {
    updateToken({
      status: TokenStatus.IN_PROGRESS,
      note: token.note,
      sub_queue: subQueueId,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isUpdating}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowAssignDialog(true)}
            disabled={isUpdating}
          >
            <UserCheck className="size-4" />
            {t("assign_to_service_point")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={isUpdating}
          >
            <X className="size-4 text-danger-500" />
            {t("cancel_token")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TokenCancelConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        token={token}
        onConfirm={handleCancelToken}
        isLoading={isUpdating}
      />

      <AssignToServicePointDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        token={token}
        subQueues={subQueues}
        onConfirm={handleAssignToServicePoint}
        isLoading={isUpdating}
      />
    </>
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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
      setShowCancelDialog(false);
      setShowCompleteDialog(false);
    },
  });

  const handleCancelToken = () => {
    updateToken({
      status: TokenStatus.CANCELLED,
      note: token.note,
    });
  };

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
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={isUpdating}
            >
              <X className="size-4 text-danger-500" />
              {t("cancel_token")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TokenCancelConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        token={token}
        onConfirm={handleCancelToken}
        isLoading={isUpdating}
      />

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

export function TokenCard({
  facilityId,
  token,
  options,
}: {
  facilityId: string;
  token: TokenRead | null;
  options?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-center justify-between p-3 bg-white rounded-lg shadow">
      <div className="flex flex-col">
        {token ? (
          <Link
            href={
              token.patient
                ? `/facility/${facilityId}/patients/verify?${new URLSearchParams(
                    {
                      phone_number: token.patient.phone_number,
                      year_of_birth: token.patient.year_of_birth.toString(),
                      partial_id: token.patient.id.slice(0, 5),
                      queue_id: token.queue.id,
                      token_id: token.id,
                    },
                  ).toString()}`
                : "#"
            }
            className="font-semibold hover:underline transition-colors"
          >
            <span className="font-semibold flex items-center gap-1">
              {token.patient ? token.patient.name : renderTokenNumber(token)}
              <ExternalLink className="size-4" />
            </span>
          </Link>
        ) : (
          <Skeleton className="h-4 w-36 my-2" />
        )}
        {/* <div className="flex items-center gap-1.5"></div> */}
        {/* TODO: do we show tags here? or something else? */}
      </div>
      <div className="flex items-center gap-3">
        {token ? (
          <div className="min-h-14 p-2 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">
              {renderTokenNumber(token)}
            </span>
          </div>
        ) : (
          <Skeleton className="h-12 w-20" />
        )}
        {options}
      </div>
    </div>
  );
}

export function TokenCardSkeleton({ count = 5 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <TokenCard key={index} token={null} facilityId={""} />
  ));
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
