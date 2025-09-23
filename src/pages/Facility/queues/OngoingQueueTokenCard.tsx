import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AssignToServicePointDialog } from "@/pages/Facility/queues/AssignToServicePointDialog";
import { CancelTokenDialog } from "@/pages/Facility/queues/CancelTokenDialog";
import {
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
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { useTokenListInfiniteQuery } from "./utils";

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
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [showAssignToServicePointDialog, setShowAssignToServicePointDialog] =
    useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { mutate: updateToken } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token?.queue.id ?? "",
        id: token?.id ?? "",
      },
    }),
    onSuccess: (data: TokenRead) => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token?.queue.id ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token?.queue.id ?? ""],
      });

      if (data.status === TokenStatus.FULFILLED) {
        toast.success(t("token_has_been_completed"));
        return;
      }
    },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger ref={contextMenuTriggerRef}>
        <div
          className={cn(
            "relative flex gap-3 items-center justify-between p-3 bg-gray-50 rounded-lg shadow",
            token?.status === TokenStatus.IN_PROGRESS &&
              "border border-primary-500",
          )}
        >
          <div className="flex flex-col">
            {token ? (
              <Link
                basePath="/"
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
                  {token.patient
                    ? token.patient.name
                    : renderTokenNumber(token)}
                  <ExternalLink className="size-4" />
                </span>
              </Link>
            ) : (
              <Skeleton className="h-4 w-36 my-2" />
            )}
            {/* TODO: do we show tags here? or something else? */}
          </div>
          <div className="flex items-center gap-3">
            {token ? (
              <div className="flex gap-2 items-center justify-center p-2 bg-gray-100 border border-gray-200 rounded-lg">
                <span className="text-lg font-bold text-black">
                  {renderTokenNumber(token)}
                </span>
              </div>
            ) : (
              <Skeleton className="h-12 w-20" />
            )}
            {options}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.bottom;
                contextMenuTriggerRef.current?.dispatchEvent(
                  new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                  }),
                );
              }}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      {token && (
        <>
          <ContextMenuContent>
            {token.status === TokenStatus.CREATED && token.sub_queue && (
              <ContextMenuItem
                onClick={() =>
                  updateToken({
                    status: TokenStatus.IN_PROGRESS,
                    note: token.note,
                    sub_queue: token.sub_queue?.id || null,
                  })
                }
              >
                <CircleDot className="size-4 mr-2" />
                {t("mark_as_now_serving")}
              </ContextMenuItem>
            )}
            {token.status === TokenStatus.IN_PROGRESS && (
              <>
                <ContextMenuItem
                  onClick={() =>
                    updateToken({
                      status: TokenStatus.FULFILLED,
                      note: token.note,
                      sub_queue: token.sub_queue?.id || null,
                    })
                  }
                >
                  <Check className="size-4 mr-2" />
                  {t("mark_as_complete")}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    updateToken({
                      status: TokenStatus.CREATED,
                      note: token.note,
                      sub_queue: token.sub_queue?.id || null,
                    })
                  }
                >
                  <Megaphone className="size-4 mr-2" />
                  {t("move_to_calling")}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    updateToken({
                      status: TokenStatus.UNFULFILLED,
                      note: token.note,
                      sub_queue: null,
                    })
                  }
                >
                  <BringToFront className="size-4 mr-2" />
                  {t("move_to_awaiting_recall")}
                </ContextMenuItem>
              </>
            )}
            {token.sub_queue && (
              <ContextMenuItem
                onClick={() =>
                  updateToken({
                    status: TokenStatus.CREATED,
                    note: token.note,
                    sub_queue: null,
                  })
                }
              >
                <RotateCcw className="size-4 mr-2" />
                {t("move_to_waiting")}
              </ContextMenuItem>
            )}

            <ContextMenuItem
              onClick={() => setShowAssignToServicePointDialog(true)}
            >
              {token.sub_queue ? (
                <>
                  <RedoDot className="size-4 mr-2" />
                  {t("reassign_service_point")}
                </>
              ) : (
                <>
                  <TicketCheck className="size-4 mr-2" />
                  {t("assign_to_service_point")}
                </>
              )}
            </ContextMenuItem>

            <ContextMenuSeparator />
            {/* Cancel Token */}
            {![
              TokenStatus.CANCELLED,
              TokenStatus.ENTERED_IN_ERROR,
              TokenStatus.FULFILLED,
            ].includes(token.status) && (
              <ContextMenuItem onClick={() => setShowCancelDialog(true)}>
                <OctagonX className="size-4 mr-2 text-danger-700" />
                <span className="text-danger-700">{t("cancel_token")}</span>
              </ContextMenuItem>
            )}

            {token.status !== TokenStatus.ENTERED_IN_ERROR && (
              <ContextMenuItem
                onClick={() =>
                  updateToken({
                    status: TokenStatus.ENTERED_IN_ERROR,
                    note: token.note,
                    sub_queue: null,
                  })
                }
              >
                <OctagonX className="size-4 mr-2 text-danger-700" />
                <span className="text-danger-700">
                  {t("mark_as_entered_in_error")}
                </span>
              </ContextMenuItem>
            )}
          </ContextMenuContent>
          <AssignToServicePointDialog
            open={showAssignToServicePointDialog}
            onOpenChange={setShowAssignToServicePointDialog}
            token={token}
          />
          <CancelTokenDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            token={token}
          />
        </>
      )}
    </ContextMenu>
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
