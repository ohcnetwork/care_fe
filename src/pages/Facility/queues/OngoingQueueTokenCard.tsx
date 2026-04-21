import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CancelTokenDialog } from "@/pages/Facility/queues/CancelTokenDialog";
import { useQueueServicePoints } from "@/pages/Facility/queues/useQueueServicePoints";
import {
  getQueueTokenStatus,
  QUEUE_TOKEN_STATUS_COLORS,
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BringToFront,
  Check,
  CircleDot,
  ExternalLink,
  Megaphone,
  MoreHorizontal,
  OctagonX,
  RedoDot,
  RotateCcw,
  TicketCheck,
} from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { useTokenListInfiniteQuery } from "./utils";

interface TokenActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
}

function useTokenActions({
  facilityId,
  token,
  onCancelClick,
  onEnteredInErrorClick,
}: {
  facilityId: string;
  token: TokenRead;
  onCancelClick: () => void;
  onEnteredInErrorClick: () => void;
}): TokenActionItem[] {
  const { t } = useTranslation();
  const { assignedServicePoints } = useQueueServicePoints();
  const queryClient = useQueryClient();

  const { mutate: updateToken } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token.queue.id,
        id: token.id,
      },
    }),
    onSuccess: (data: TokenRead) => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token.queue.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token.queue.id],
      });
      if (data.status === TokenStatus.FULFILLED) {
        toast.success(t("token_has_been_completed"));
      }
    },
  });

  const items: TokenActionItem[] = [];

  if (token.status === TokenStatus.CREATED && token.sub_queue) {
    items.push({
      key: "mark_as_now_serving",
      label: t("mark_as_now_serving"),
      icon: <CircleDot className="size-4 mr-2" />,
      onSelect: () =>
        updateToken({
          status: TokenStatus.IN_PROGRESS,
          note: token.note,
          sub_queue: token.sub_queue?.id || null,
        }),
    });
  }

  if (token.status === TokenStatus.IN_PROGRESS) {
    items.push(
      {
        key: "move_to_calling",
        label: t("move_to_calling"),
        icon: <Megaphone className="size-4 mr-2" />,
        onSelect: () =>
          updateToken({
            status: TokenStatus.CREATED,
            note: token.note,
            sub_queue: token.sub_queue?.id || null,
          }),
      },
      {
        key: "move_to_awaiting_recall_in_progress",
        label: t("move_to_awaiting_recall"),
        icon: <BringToFront className="size-4 mr-2" />,
        onSelect: () =>
          updateToken({
            status: TokenStatus.UNFULFILLED,
            note: token.note,
            sub_queue: null,
          }),
      },
    );
  }

  if (token.sub_queue) {
    items.push({
      key: "move_to_waiting",
      label: t("move_to_waiting"),
      icon: <RotateCcw className="size-4 mr-2" />,
      onSelect: () =>
        updateToken({
          status: TokenStatus.CREATED,
          note: token.note,
          sub_queue: null,
        }),
    });
  }

  const otherServicePoints = assignedServicePoints.filter(
    (service) => service.id !== token.sub_queue?.id,
  );

  otherServicePoints.forEach((service) => {
    items.push({
      key: `assign_${service.id}`,
      label: token.sub_queue
        ? t("reassign_service_point", { name: service.name })
        : t("mark_as_in_service", { name: service.name }),
      icon: token.sub_queue ? (
        <RedoDot className="size-4 mr-2" />
      ) : (
        <TicketCheck className="size-4 mr-2" />
      ),
      onSelect: () =>
        updateToken({
          status: TokenStatus.IN_PROGRESS,
          note: token.note,
          sub_queue: service.id,
        }),
    });
  });

  otherServicePoints.forEach((service) => {
    items.push({
      key: `call_to_${service.id}`,
      label: t("call_to", { name: service.name }),
      icon: <Megaphone className="size-4 mr-2" />,
      onSelect: () =>
        updateToken({
          status: TokenStatus.CREATED,
          note: token.note,
          sub_queue: service.id,
        }),
    });
  });

  items.push({
    key: "mark_as_complete",
    label: t("mark_as_complete"),
    icon: <Check className="size-4 mr-2" />,
    onSelect: () =>
      updateToken({
        status: TokenStatus.FULFILLED,
        note: token.note,
        sub_queue: token.sub_queue?.id || null,
      }),
  });

  const cancellable = ![
    TokenStatus.CANCELLED,
    TokenStatus.ENTERED_IN_ERROR,
    TokenStatus.FULFILLED,
  ].includes(token.status);

  if (cancellable) {
    items.push({
      key: "cancel_token",
      label: t("cancel_token"),
      icon: <OctagonX className="size-4 mr-2 text-danger-700" />,
      onSelect: onCancelClick,
      danger: true,
      separatorBefore: true,
    });
  }

  if (token.status !== TokenStatus.ENTERED_IN_ERROR) {
    items.push({
      key: "mark_as_entered_in_error",
      label: t("mark_as_entered_in_error"),
      icon: <OctagonX className="size-4 mr-2 text-danger-700" />,
      onSelect: onEnteredInErrorClick,
      danger: true,
      separatorBefore: !cancellable,
    });
  }

  return items;
}

export function OngoingQueueTokenCard({
  facilityId,
  token,
  options,
}: {
  facilityId: string;
  token: TokenRead | null;
  options?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEnteredInErrorDialog, setShowEnteredInErrorDialog] =
    useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg shadow">
        <Skeleton className="h-4 w-36 my-2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <OngoingQueueTokenCardInner
      facilityId={facilityId}
      token={token}
      options={options}
      showCancelDialog={showCancelDialog}
      setShowCancelDialog={setShowCancelDialog}
      showEnteredInErrorDialog={showEnteredInErrorDialog}
      setShowEnteredInErrorDialog={setShowEnteredInErrorDialog}
      t={t}
    />
  );
}

function OngoingQueueTokenCardInner({
  facilityId,
  token,
  options,
  showCancelDialog,
  setShowCancelDialog,
  showEnteredInErrorDialog,
  setShowEnteredInErrorDialog,
  t,
}: {
  facilityId: string;
  token: TokenRead;
  options?: React.ReactNode;
  showCancelDialog: boolean;
  setShowCancelDialog: (open: boolean) => void;
  showEnteredInErrorDialog: boolean;
  setShowEnteredInErrorDialog: (open: boolean) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const actions = useTokenActions({
    facilityId,
    token,
    onCancelClick: () => setShowCancelDialog(true),
    onEnteredInErrorClick: () => setShowEnteredInErrorDialog(true),
  });

  const renderItem = (
    item: TokenActionItem,
    Item: typeof ContextMenuItem | typeof DropdownMenuItem,
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator,
  ) => (
    <span key={item.key}>
      {item.separatorBefore && <Separator />}
      <Item onSelect={item.onSelect}>
        {item.icon}
        <span className={item.danger ? "text-danger-700" : undefined}>
          {item.label}
        </span>
      </Item>
    </span>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "relative flex flex-col md:flex-row gap-2 md:gap-3 items-stretch md:items-center justify-between p-3 bg-gray-50 rounded-lg shadow",
            token.status === TokenStatus.IN_PROGRESS &&
              "border border-primary-500",
          )}
        >
          <div className="flex items-center justify-between gap-2 md:w-auto w-full min-w-0">
            <Link
              basePath="/"
              href={`/facility/${facilityId}/queue/${token.queue.id}/token/${token.id}`}
              className="font-semibold hover:underline transition-colors min-w-0"
            >
              <span className="font-semibold flex items-center gap-1 min-w-0">
                <span className="truncate">
                  {token.patient
                    ? token.patient.name
                    : renderTokenNumber(token)}
                </span>
                <ExternalLink className="size-4 shrink-0" />
              </span>
            </Link>
            {/* Kebab (visible on all sizes as primary action trigger) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("actions")}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                {actions.map((item) =>
                  renderItem(item, DropdownMenuItem, DropdownMenuSeparator),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex w-full md:w-auto items-center flex-wrap gap-2 md:gap-3">
            <Button variant="outline" asChild size="sm">
              <Link
                basePath="/"
                href={`/facility/${facilityId}/queue/${token.queue.id}/token/${token.id}`}
              >
                {t("encounter")}
              </Link>
            </Button>
            <div className="flex gap-2 items-center justify-center p-1 bg-gray-100 border border-gray-200 rounded-lg">
              <Badge
                variant={QUEUE_TOKEN_STATUS_COLORS[getQueueTokenStatus(token)]}
                className="h-2 w-2 rounded-full p-0 border"
              />
              <span className="text-sm sm:text-base font-medium text-black">
                {t(`token_status__${getQueueTokenStatus(token)}`)}:
              </span>
              <span className="text-base sm:text-lg font-bold text-black">
                {renderTokenNumber(token)}
              </span>
            </div>
            {options}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent collisionPadding={8} avoidCollisions>
        {actions.map((item) =>
          renderItem(item, ContextMenuItem, ContextMenuSeparator),
        )}
      </ContextMenuContent>

      <CancelTokenDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        token={token}
      />
      <EnteredInErrorDialog
        open={showEnteredInErrorDialog}
        onOpenChange={setShowEnteredInErrorDialog}
        facilityId={facilityId}
        token={token}
      />
    </ContextMenu>
  );
}

function EnteredInErrorDialog({
  open,
  onOpenChange,
  facilityId,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  token: TokenRead;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateToken, isPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token.queue.id,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token.queue.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token.queue.id],
      });
      onOpenChange(false);
    },
  });

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("mark_as_entered_in_error")}
      description={t("mark_as_entered_in_error_confirmation", {
        patientName: token.patient?.name,
        tokenNumber: renderTokenNumber(token),
      })}
      onConfirm={() =>
        updateToken({
          status: TokenStatus.ENTERED_IN_ERROR,
          note: token.note,
          sub_queue: null,
        })
      }
      cancelText={t("cancel")}
      confirmText={t("mark_as_entered_in_error")}
      variant="destructive"
      disabled={isPending}
    />
  );
}

export function OngoingQueueTokenCardsList({
  facilityId,
  queueId,
  emptyState,
  header,
  qParams,
}: {
  facilityId: string;
  queueId: string;
  qParams: Record<string, unknown>;
  emptyState?: React.ReactNode;
  header?: React.ReactNode;
}) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTokenListInfiniteQuery({
      facilityId,
      queueId,
      qParams,
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const tokens = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {tokens.length > 0 ? (
        <>
          {header}
          {tokens.map((token) => (
            <OngoingQueueTokenCard
              key={token.id}
              token={token}
              facilityId={facilityId}
            />
          ))}
          <div ref={ref} className="-mt-3" />
        </>
      ) : (
        emptyState
      )}
      {isFetchingNextPage &&
        Array.from({ length: 3 }, (_, index) => (
          <OngoingQueueTokenCard key={index} token={null} facilityId={""} />
        ))}
    </div>
  );
}
