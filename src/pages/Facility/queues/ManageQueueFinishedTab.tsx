import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DoorOpenIcon,
  ExternalLink,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { useTokenListInfiniteQuery } from "./utils";

const INACTIVE_TOKEN_STATUSES = [TokenStatus.FULFILLED, TokenStatus.CANCELLED];

export function ManageQueueFinishedTab({
  facilityId,
  queueId,
}: {
  facilityId: string;
  queueId: string;
}) {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTokenListInfiniteQuery({
      facilityId,
      queueId,
      qParams: {
        status: INACTIVE_TOKEN_STATUSES.join(","),
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("token_number")}</TableHead>
              <TableHead>{t("patient_name")}</TableHead>
              <TableHead>{t("service_points")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="w-[100px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token, index) => (
              <TableRow
                key={token.id}
                ref={index === tokens.length - 1 ? ref : undefined}
              >
                <TableCell>
                  <span className="font-mono font-semibold">
                    {renderTokenNumber(token)}
                  </span>
                </TableCell>
                <TableCell>
                  {token.patient ? (
                    <Link
                      href={`/facility/${facilityId}/patients/verify?${new URLSearchParams(
                        {
                          phone_number: token.patient.phone_number,
                          year_of_birth: token.patient.year_of_birth.toString(),
                          partial_id: token.patient.id.slice(0, 5),
                          queue_id: token.queue.id,
                          token_id: token.id,
                        },
                      ).toString()}`}
                      className="hover:underline transition-colors flex items-center gap-1"
                    >
                      {token.patient.name}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {token.sub_queue?.name || (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      token.status === TokenStatus.FULFILLED
                        ? "green"
                        : token.status === TokenStatus.CANCELLED
                          ? "destructive"
                          : "secondary"
                    }
                    size="sm"
                  >
                    {t(token.status.toLowerCase())}
                  </Badge>
                </TableCell>
                <TableCell>
                  <FinishedTokenOptions
                    token={token}
                    facilityId={facilityId}
                    queueId={queueId}
                  />
                </TableCell>
              </TableRow>
            ))}
            {isFetchingNextPage && <FinishedTokensTableSkeleton count={5} />}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-20 border border-gray-100">
          <DoorOpenIcon className="size-8 text-gray-700" />
          <span className="text-lg font-semibold text-gray-700">
            {t("no_tokens_finished")}
          </span>
          <span className="text-sm text-gray-500">
            {t("no_patient_is_finished")}
          </span>
        </div>
      )}
    </div>
  );
}

function FinishedTokensTableSkeleton({ count = 5 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  ));
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
        queryKey: ["infinite-tokens", facilityId, queueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
      setShowMoveBackToInServiceDialog(false);
    },
  });

  const handleMoveBackToInService = () => {
    updateToken({
      status: TokenStatus.IN_PROGRESS,
      note: token.note,
      sub_queue: token.sub_queue?.id || null,
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
          <DropdownMenuItem
            onClick={() =>
              updateToken({
                status: TokenStatus.UNFULFILLED,
                note: token.note,
                sub_queue: null,
              })
            }
            disabled={isUpdating}
          >
            <BringToFront className="size-4" />
            {t("move_to_awaiting_recall")}
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
