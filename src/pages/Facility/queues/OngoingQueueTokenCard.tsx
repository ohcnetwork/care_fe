import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { PatientTagsDisplay } from "@/components/Patient/PatientTagsDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { CancelTokenDialog } from "@/pages/Facility/queues/CancelTokenDialog";
import {
  ServicePointSelector,
  ServicePointSelectorAction,
} from "@/pages/Facility/queues/ServicePointSelector";
import { useQueueServicePoints } from "@/pages/Facility/queues/useQueueServicePoints";
import {
  getQueueTokenStatus,
  QUEUE_TOKEN_STATUS_COLORS,
  QueueTokenStatus,
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { formatPatientAge } from "@/Utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowBigDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BanknoteX,
  BringToFront,
  Check,
  Megaphone,
  OctagonX,
  RotateCcwSquare,
  ScanEye,
  Stethoscope,
} from "lucide-react";
import { Link, navigate } from "raviger";
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
  onChangeServicePointClick,
}: {
  facilityId: string;
  token: TokenRead;
  onCancelClick: () => void;
  onEnteredInErrorClick: () => void;
  onChangeServicePointClick: () => void;
}): TokenActionItem[] {
  const { t } = useTranslation();
  const { assignedServicePointIds } = useQueueServicePoints();
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

  if (
    (token.status === TokenStatus.CREATED && !token.sub_queue) ||
    token.status === TokenStatus.UNFULFILLED
  ) {
    items.push({
      key: "open_encounter",
      label: t("open_encounter"),
      icon: <ScanEye className="size-4 mr-2" />,
      onSelect: () => {
        navigate(
          `/facility/${facilityId}/queue/${token.queue.id}/token/${token.id}`,
        );
      },
    });
  }

  if (token.status === TokenStatus.IN_PROGRESS) {
    items.push(
      {
        key: "move_to_up_next",
        label: t("move_to_up_next"),
        icon: <ArrowBigDown className="size-4 mr-2" />,
        onSelect: () =>
          updateToken({
            status: TokenStatus.CREATED,
            note: token.note,
            sub_queue: token.sub_queue?.id || null,
          }),
      },
      {
        key: "recall_later",
        label: t("recall_later"),
        icon: <RotateCcwSquare className="size-4 mr-2" />,
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
      key: "return_to_waiting",
      label: t("return_to_waiting"),
      icon: <BringToFront className="size-4 mr-2" />,
      onSelect: () =>
        updateToken({
          status: TokenStatus.CREATED,
          note: token.note,
          sub_queue: null,
        }),
    });

    if (assignedServicePointIds.length > 1) {
      items.push({
        key: "change_service_point",
        label: t("change_service_point"),
        icon: <ArrowLeftRight className="size-4 mr-2" />,
        onSelect: onChangeServicePointClick,
      });
    }
  }

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
      key: "entered_in_error",
      label: t("entered_in_error"),
      icon: <BanknoteX className="size-4 mr-2 text-danger-700" />,
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
}: {
  facilityId: string;
  token: TokenRead | null;
}) {
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
      showCancelDialog={showCancelDialog}
      setShowCancelDialog={setShowCancelDialog}
      showEnteredInErrorDialog={showEnteredInErrorDialog}
      setShowEnteredInErrorDialog={setShowEnteredInErrorDialog}
    />
  );
}

function OngoingQueueTokenCardInner({
  facilityId,
  token,
  showCancelDialog,
  setShowCancelDialog,
  showEnteredInErrorDialog,
  setShowEnteredInErrorDialog,
}: {
  facilityId: string;
  token: TokenRead;
  options?: React.ReactNode;
  showCancelDialog: boolean;
  setShowCancelDialog: (open: boolean) => void;
  showEnteredInErrorDialog: boolean;
  setShowEnteredInErrorDialog: (open: boolean) => void;
}) {
  const isMobile = useBreakpoints({ default: true, sm: false });

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger>
          <TokenTrigger token={token} facilityId={facilityId} />
        </DrawerTrigger>
        <DrawerContent className="flex flex-col items-center px-3 pb-2">
          <TokenContent
            facilityId={facilityId}
            token={token}
            setShowCancelDialog={setShowCancelDialog}
            setShowEnteredInErrorDialog={setShowEnteredInErrorDialog}
            showCancelDialog={showCancelDialog}
            showEnteredInErrorDialog={showEnteredInErrorDialog}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger>
        <TokenTrigger token={token} facilityId={facilityId} />
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center px-3 pb-2">
        <TokenContent
          facilityId={facilityId}
          token={token}
          setShowCancelDialog={setShowCancelDialog}
          setShowEnteredInErrorDialog={setShowEnteredInErrorDialog}
          showCancelDialog={showCancelDialog}
          showEnteredInErrorDialog={showEnteredInErrorDialog}
        />
      </DialogContent>
    </Dialog>
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

const TokenTrigger = ({
  token,
  facilityId,
}: {
  token: TokenRead;
  facilityId: string;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-white rounded-lg shadow cursor-pointer",
        token.status === TokenStatus.IN_PROGRESS && "border border-primary-500",
      )}
    >
      {token.status === TokenStatus.IN_PROGRESS && (
        <span
          aria-hidden="true"
          className="absolute top-4 left-0 inset-y-6 w-1 rounded-r-lg bg-primary-500 h-5"
        />
      )}
      <div className="flex sm:contents items-start justify-between w-full">
        <div className="flex flex-col items-start gap-1 min-w-0">
          <span className="text-gray-950 font-semibold">
            {token.patient ? token.patient.name : renderTokenNumber(token)}
          </span>
          {token.patient && (
            <span className="text-sm text-gray-700">
              {formatPatientAge(token.patient, true)},{" "}
              {t(`GENDER__${token.patient.gender}`)}
            </span>
          )}
        </div>
        <ArrowRight size={20} className="sm:hidden text-gray-950 mr-2" />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        {getQueueTokenStatus(token) === QueueTokenStatus.SERVING && (
          <Button
            variant="outline_primary"
            asChild
            size="md"
            className="hidden sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              basePath="/"
              href={`/facility/${facilityId}/queue/${token.queue.id}/token/${token.id}`}
            >
              {t("encounter")}
            </Link>
          </Button>
        )}
        <div
          className={cn(
            "flex w-full sm:w-auto gap-2 items-center justify-center py-1 px-3 bg-gray-100 border border-gray-200 rounded-md whitespace-nowrap text-black",
            getQueueTokenStatus(token) === QueueTokenStatus.SERVING &&
              "bg-primary-100 border border-primary-400 text-primary-900",
          )}
        >
          <span
            className={cn(
              "items-center gap-2",
              getQueueTokenStatus(token) === QueueTokenStatus.WAITING
                ? "flex sm:hidden"
                : "flex",
            )}
          >
            <Badge
              variant={QUEUE_TOKEN_STATUS_COLORS[getQueueTokenStatus(token)]}
              className="h-2 w-2 rounded-full p-0 border"
            />
            <span className="text-sm font-medium">
              {t(`token_status__${getQueueTokenStatus(token)}`)}
            </span>
          </span>
          <span className="text-lg font-bold ">{renderTokenNumber(token)}</span>
        </div>
      </div>

      <ArrowRight size={20} className="hidden sm:block shrink-0" />
    </div>
  );
};

const TokenContent = ({
  token,
  facilityId,
  setShowCancelDialog,
  setShowEnteredInErrorDialog,
  showCancelDialog,
  showEnteredInErrorDialog,
}: {
  token: TokenRead;
  facilityId: string;
  setShowCancelDialog: (open: boolean) => void;
  setShowEnteredInErrorDialog: (open: boolean) => void;
  showCancelDialog: boolean;
  showEnteredInErrorDialog: boolean;
}) => {
  const { t } = useTranslation();
  const actions = useTokenActions({
    facilityId,
    token,
    onCancelClick: () => setShowCancelDialog(true),
    onEnteredInErrorClick: () => setShowEnteredInErrorDialog(true),
    onChangeServicePointClick: () => {
      setServicePointAction("change_service_point");
      setOpenServicePointSelector(true);
    },
  });
  const [servicePointAction, setServicePointAction] =
    useState<ServicePointSelectorAction>("serve");

  const [openServicePointSelector, setOpenServicePointSelector] =
    useState(false);

  const queueStatus = getQueueTokenStatus(token);
  const queryClient = useQueryClient();

  const { assignedServicePoints } = useQueueServicePoints();

  const hasNoAssignedServicePoints = assignedServicePoints.length === 0;

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
    },
  });

  const handleUpdateToken = () => {
    if (assignedServicePoints.length === 1) {
      updateToken({
        status: TokenStatus.IN_PROGRESS,
        note: token.note,
        sub_queue: assignedServicePoints[0].id,
      });
      return;
    }
    setServicePointAction("serve");
    setOpenServicePointSelector(true);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <DialogHeader className="flex flex-row items-start justify-between">
        {getQueueTokenStatus(token) === QueueTokenStatus.WAITING ||
        getQueueTokenStatus(token) === QueueTokenStatus.RECALL ? (
          <div className="flex flex-col items-start">
            <span className="text-gray-950 font-semibold">
              {token.patient ? token.patient.name : renderTokenNumber(token)}
            </span>
            {token.patient && (
              <span className="text-sm text-gray-700">
                {formatPatientAge(token.patient, true)},{" "}
                {t(`GENDER__${token.patient.gender}`)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <h5 className="text-gray-950 font-semibold">
              {token.sub_queue?.name}
            </h5>
            <Badge
              variant={QUEUE_TOKEN_STATUS_COLORS[getQueueTokenStatus(token)]}
              className="h-2 w-2 rounded-full p-0 border"
            />
            <span className="text-sm font-medium text-gray-700">
              {t(`token_status__${getQueueTokenStatus(token)}`)}
            </span>
          </div>
        )}
      </DialogHeader>
      <Separator className="mb-2" />
      <div className="flex flex-col gap-3">
        {queueStatus === QueueTokenStatus.WAITING ||
        queueStatus === QueueTokenStatus.RECALL ? (
          <div className="flex w-full sm:w-auto gap-2 items-center justify-center py-1 px-3 bg-gray-100 border border-gray-200 rounded-lg whitespace-nowrap">
            <span className="flex gap-2 items-center">
              <Badge
                variant={QUEUE_TOKEN_STATUS_COLORS[getQueueTokenStatus(token)]}
                className="h-2 w-2 rounded-full p-0 border"
              />
              <span className="text-sm sm:text-base font-medium text-black">
                {t(`token_status__${getQueueTokenStatus(token)}`)}:
              </span>
            </span>

            <span className="text-lg font-bold text-black">
              {renderTokenNumber(token)}
            </span>
          </div>
        ) : (
          <div className="flex justify-between bg-gray-50 border border-gray-200 rounded-lg p-2">
            <div className="flex flex-col">
              <span className="text-gray-950 font-semibold">
                {token.patient ? token.patient.name : renderTokenNumber(token)}
              </span>

              {token.patient && (
                <span className="text-sm text-gray-700">
                  {formatPatientAge(token.patient, true)},{" "}
                  {t(`GENDER__${token.patient.gender}`)}
                </span>
              )}
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-lg whitespace-nowrap flex items-center px-2">
              <span className="text-lg font-bold text-black">
                {renderTokenNumber(token)}
              </span>
            </div>
          </div>
        )}
        {token.patient && (
          <PatientTagsDisplay
            patient={token.patient}
            className="text-xs flex-1"
            showLabel={false}
          />
        )}
        {hasNoAssignedServicePoints && (
          <div className="flex gap-2 w-full border-2 border-dotted p-2 rounded-lg items-center justify-center">
            <span className="italic text-sm text-gray-500">
              {t("no_service_points_are_present")}
            </span>
          </div>
        )}
        {queueStatus === QueueTokenStatus.WAITING ||
        queueStatus === QueueTokenStatus.RECALL ? (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline_primary"
              className="flex-1 gap-1"
              onClick={() => {
                if (assignedServicePoints.length === 1) {
                  updateToken({
                    status: TokenStatus.CREATED,
                    note: token.note,
                    sub_queue: assignedServicePoints[0].id,
                  });
                  return;
                }
                setServicePointAction("move_to_up_next");
                setOpenServicePointSelector(true);
              }}
              disabled={isPending || hasNoAssignedServicePoints}
            >
              <ArrowUpRight className="size-4 mr-2" />
              {t("move_to_up_next")}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleUpdateToken}
              disabled={isPending || hasNoAssignedServicePoints}
            >
              <Megaphone className="size-4 mr-2" />
              {t("serve")}
            </Button>
          </div>
        ) : queueStatus === QueueTokenStatus.SERVING ? (
          <Button asChild variant="primary">
            <Link
              href={`/facility/${facilityId}/queue/${token.queue.id}/token/${token.id}`}
              className="flex items-center gap-1"
            >
              <Stethoscope className="size-4 mr-2" />
              <span className="text-white font-semibold">
                {t("open_encounter")}
              </span>
            </Link>
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline_primary" className="flex-1 group">
              <Link
                href={`/facility/${facilityId}/queue/${token.queue.id}/token/${token.id}`}
                className="flex items-center gap-1"
              >
                <Stethoscope className="size-4 mr-2 group-hover:text-white" />
                <span className="text-primary font-semibold group-hover:text-white">
                  {t("encounter")}
                </span>
              </Link>
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateToken}
              disabled={isPending}
              className="flex-1"
            >
              <Megaphone className="size-4 mr-2" />
              <span className="text-white font-semibold">{t("serve")}</span>
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-3">
          <span className="text-gray-600 text-sm">{t("more_actions")}</span>
          <div className="flex flex-col gap-1">
            {actions.map((action) => (
              <div key={action.key}>
                {action.separatorBefore && <Separator className="my-2" />}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex gap-3 text-gray-950 text-sm font-semibold w-full justify-start underline",
                    action.danger && "text-danger-600",
                  )}
                  onClick={action.onSelect}
                >
                  <span>{action.icon}</span>
                  {action.label}
                </Button>
              </div>
            ))}
          </div>
        </div>
        <ServicePointSelector
          open={openServicePointSelector}
          onOpenChange={setOpenServicePointSelector}
          facilityId={facilityId}
          token={token}
          subQueues={assignedServicePoints}
          action={servicePointAction}
        />
      </div>
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
    </div>
  );
};
