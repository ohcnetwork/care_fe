import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
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
import query from "@/Utils/request/query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ExternalLink, MoreHorizontal, TicketCheck, X } from "lucide-react";
import { Link } from "raviger";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

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

  const [showAssignToServicePointDialog, setShowAssignToServicePointDialog] =
    useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
          {token?.status === TokenStatus.IN_PROGRESS && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-8 rounded-r-sm bg-primary-500" />
          )}
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
                {token.status === TokenStatus.IN_PROGRESS && (
                  <div className="flex gap-1 items-center">
                    <div className="size-2 border border-primary-500 rounded-full bg-primary-200" />
                    <span className="text-sm font-medium">
                      {t("now_serving")}:
                    </span>
                  </div>
                )}
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
            {/* Assign to Service Point */}
            {[TokenStatus.CREATED, TokenStatus.UNFULFILLED].includes(
              token.status,
            ) && (
              <ContextMenuItem
                onClick={() => setShowAssignToServicePointDialog(true)}
              >
                <TicketCheck className="size-4 mr-2" />
                {t("assign_to_service_point")}
              </ContextMenuItem>
            )}

            {/* Cancel Token */}
            {![
              TokenStatus.CANCELLED,
              TokenStatus.ENTERED_IN_ERROR,
              TokenStatus.FULFILLED,
            ].includes(token.status) && (
              <ContextMenuItem onClick={() => setShowCancelDialog(true)}>
                <X className="size-4 mr-2 text-danger-500" />
                <span className="text-danger-500">{t("cancel_token")}</span>
              </ContextMenuItem>
            )}
          </ContextMenuContent>
          <AssignToServicePointDialog
            open={showAssignToServicePointDialog}
            onOpenChange={setShowAssignToServicePointDialog}
            token={token}
            subQueues={[]}
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

const PAGE_SIZE = 50;

export function OngoingQueueTokenCardsList({
  facilityId,
  queueId,
  subQueueId,
  status,
  emptyState,
}: {
  facilityId: string;
  queueId: string;
  subQueueId?: string;
  status: TokenStatus;
  emptyState?: React.ReactNode;
}) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "infinite-tokens",
        facilityId,
        queueId,
        { sub_queue: subQueueId, status },
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(tokenApi.list, {
          pathParams: { facility_id: facilityId, queue_id: queueId },
          queryParams: {
            sub_queue: subQueueId,
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
    <div className="flex flex-col gap-4">
      {tokens.length > 0 ? (
        <>
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
