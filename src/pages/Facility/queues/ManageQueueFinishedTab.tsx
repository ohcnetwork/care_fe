import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  QueueColumn,
  TokenCard,
  TokenCardSkeleton,
} from "@/pages/Facility/queues/ManageQueueOngoingTab";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { DoorOpenIcon, MoreHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

export function ManageQueueFinishedTab({
  facilityId,
  queueId,
  subQueues,
}: {
  facilityId: string;
  queueId: string;
  subQueues: TokenSubQueueRead[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex space-x-4 overflow-x-auto w-full">
        {subQueues.map((subQueue) => (
          <FinishedTokensColumn
            key={subQueue.id}
            facilityId={facilityId}
            queueId={queueId}
            subQueue={subQueue}
          />
        ))}
      </div>
    </div>
  );
}

const PAGE_SIZE = 50;

const INACTIVE_TOKEN_STATUSES = [
  //   TokenStatus.UNFULFILLED,
  //   TokenStatus.COMPLETED,
  TokenStatus.FULFILLED,
  //   TokenStatus.CANCELLED,
  //   TokenStatus.ENTERED_IN_ERROR,
];

function FinishedTokensColumn({
  facilityId,
  queueId,
  subQueue,
}: {
  facilityId: string;
  queueId: string;
  subQueue: TokenSubQueueRead;
}) {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "infinite-tokens",
        facilityId,
        queueId,
        { sub_queue: subQueue.id, status: INACTIVE_TOKEN_STATUSES },
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(tokenApi.list, {
          pathParams: { facility_id: facilityId, queue_id: queueId },
          queryParams: {
            sub_queue: subQueue.id,
            status: INACTIVE_TOKEN_STATUSES.join(","),
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
    <QueueColumn
      title={subQueue.name}
      count={
        <Badge size="sm" variant="blue">
          {data?.pages[0]?.count ?? 0}
        </Badge>
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
                  <FinishedTokenOptions
                    token={token}
                    facilityId={facilityId}
                    queueId={queueId}
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

function FinishedTokenOptions({
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
  const [showMoveBackToInServiceDialog, setShowMoveBackToInServiceDialog] =
    useState(false);

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
          { status: TokenStatus.IN_PROGRESS },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { sub_queue: token.sub_queue?.id, status: INACTIVE_TOKEN_STATUSES },
        ],
      });
      setShowMoveBackToInServiceDialog(false);
    },
  });

  const handleMoveBackToInService = () => {
    updateToken({
      status: TokenStatus.IN_PROGRESS,
      note: token.note,
      sub_queue: token.sub_queue?.id,
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
            onClick={() => setShowMoveBackToInServiceDialog(true)}
            disabled={isUpdating}
          >
            <RotateCcw className="size-4" />
            {t("move_back_to_in_service")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={showMoveBackToInServiceDialog}
        onOpenChange={setShowMoveBackToInServiceDialog}
        title={t("move_back_to_in_service")}
        description={t("move_back_to_in_service_confirmation", {
          patientName: token.patient?.name,
          tokenNumber: renderTokenNumber(token),
        })}
        onConfirm={handleMoveBackToInService}
        cancelText={t("cancel")}
        confirmText={t("confirm")}
        variant="primary"
        disabled={isUpdating}
      />
    </>
  );
}
