import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import useAuthUser from "@/hooks/useAuthUser";

import { SessionData } from "@/types/billing/cash/cashSession";
import {
  TransferData,
  TransferStatus,
} from "@/types/billing/cash/cashTransfer";
import cashTransferApi from "@/types/billing/cash/cashTransferApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface PendingTransfersCardProps {
  facilityId: string;
  session: SessionData;
}

export default function PendingTransfersCard({
  facilityId,
  session,
}: PendingTransfersCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthUser();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferData | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  // Get pending incoming transfers for this user/counter
  const { data: incomingResponse, isLoading: isLoadingIncoming } = useQuery({
    queryKey: ["cash-transfers-pending", user.id, session.counter_x_care_id],
    queryFn: query(cashTransferApi.getPendingTransfers, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        external_user_id: user.id,
        counter_x_care_id: session.counter_x_care_id,
      },
    }),
  });

  // Get sent transfers from this counter
  const { data: sentResponse, isLoading: isLoadingSent } = useQuery({
    queryKey: ["cash-transfers-sent", session.counter_x_care_id, session.id],
    queryFn: query(cashTransferApi.getSentTransfers, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        counter_x_care_id: session.counter_x_care_id,
        from_session_id: session.id,
      },
    }),
  });

  const incomingTransfers = incomingResponse?.transfers ?? [];
  const sentTransfers = sentResponse?.transfers ?? [];

  const { mutate: acceptTransfer, isPending: isAccepting } = useMutation({
    mutationFn: (transferId: number) =>
      mutate(cashTransferApi.acceptTransfer, {
        pathParams: {
          facilityId: facilityId,
          transferId: transferId.toString(),
        },
      })({
        counter_x_care_id: session.counter_x_care_id,
      }),
    onSuccess: () => {
      toast.success(t("transfer_accepted"));
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-pending"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-sent"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session-current"] });
    },
    onError: () => {
      toast.error(t("failed_to_accept_transfer"));
    },
  });

  const { mutate: rejectTransfer, isPending: isRejecting } = useMutation({
    mutationFn: (data: { transferId: number; reason?: string }) =>
      mutate(cashTransferApi.rejectTransfer, {
        pathParams: {
          facilityId: facilityId,
          transferId: data.transferId.toString(),
        },
      })({
        counter_x_care_id: session.counter_x_care_id,
        reason: data.reason,
      }),
    onSuccess: () => {
      toast.success(t("transfer_rejected"));
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-pending"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-sent"] });
      setRejectDialogOpen(false);
      setSelectedTransfer(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error(t("failed_to_reject_transfer"));
    },
  });

  const { mutate: cancelTransfer, isPending: isCancelling } = useMutation({
    mutationFn: (transferId: number) =>
      mutate(cashTransferApi.cancelTransfer, {
        pathParams: {
          facilityId: facilityId,
          transferId: transferId.toString(),
        },
      })({
        counter_x_care_id: session.counter_x_care_id,
      }),
    onSuccess: () => {
      toast.success(t("transfer_cancelled"));
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-pending"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-sent"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session-current"] });
    },
    onError: () => {
      toast.error(t("failed_to_cancel_transfer"));
    },
  });

  const handleReject = (transfer: TransferData) => {
    setSelectedTransfer(transfer);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedTransfer) {
      rejectTransfer({
        transferId: selectedTransfer.id,
        reason: rejectReason || undefined,
      });
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            {t("pending")}
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {t("accepted")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            {t("rejected")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {t("cancelled")}
          </Badge>
        );
    }
  };

  const isLoading = isLoadingIncoming || isLoadingSent;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const hasIncoming = incomingTransfers.length > 0;
  const hasSent = sentTransfers.length > 0;

  if (!hasIncoming && !hasSent) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Incoming Transfers */}
        {hasIncoming && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CareIcon
                      icon="l-inbox"
                      className="size-5 text-amber-600"
                    />
                    {t("incoming_transfers")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("pending_transfers_description")}
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700"
                >
                  {incomingTransfers.length} {t("pending")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {incomingTransfers.map((transfer: TransferData) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {transfer.from_user_name}
                      </span>
                      <CareIcon
                        icon="l-arrow-right"
                        className="size-4 text-gray-400"
                      />
                      <span className="text-gray-500">
                        {transfer.from_counter_name}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(transfer.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(transfer.created_at)}
                    </p>
                    {transfer.denominations && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(transfer.denominations).map(
                          ([denom, count]) => (
                            <Badge
                              key={denom}
                              variant="outline"
                              className="text-xs"
                            >
                              {t("currency_symbol")}
                              {denom} × {count}
                            </Badge>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(transfer)}
                      disabled={isAccepting || isRejecting}
                    >
                      <CareIcon icon="l-times" className="mr-1 size-4" />
                      {t("reject")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptTransfer(transfer.id)}
                      disabled={isAccepting || isRejecting}
                    >
                      {isAccepting ? (
                        <CareIcon
                          icon="l-spinner"
                          className="mr-1 size-4 animate-spin"
                        />
                      ) : (
                        <CareIcon icon="l-check" className="mr-1 size-4" />
                      )}
                      {t("accept")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sent Transfers */}
        {hasSent && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CareIcon
                      icon="l-export"
                      className="size-5 text-blue-600"
                    />
                    {t("sent_transfers")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("sent_transfers_description")}
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  {sentTransfers.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sentTransfers.map((transfer: TransferData) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{t("to")}</span>
                      <span className="font-medium">
                        {transfer.to_counter_name}
                      </span>
                      {transfer.to_user_name && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {transfer.to_user_name}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(transfer.amount)}
                      </p>
                      {getStatusBadge(transfer.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("sent")}: {formatDateTime(transfer.created_at)}
                      {transfer.resolved_at && (
                        <>
                          {" • "}
                          {transfer.status === "accepted"
                            ? t("accepted")
                            : t("rejected")}
                          : {formatDateTime(transfer.resolved_at)}
                        </>
                      )}
                    </p>
                    {transfer.reject_reason && (
                      <p className="text-sm text-red-600">
                        {t("reason")}: {transfer.reject_reason}
                      </p>
                    )}
                    {transfer.denominations && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(transfer.denominations).map(
                          ([denom, count]) => (
                            <Badge
                              key={denom}
                              variant="outline"
                              className="text-xs"
                            >
                              {t("currency_symbol")}
                              {denom} × {count}
                            </Badge>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  {transfer.status === "pending" && (
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelTransfer(transfer.id)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <CareIcon
                            icon="l-spinner"
                            className="mr-1 size-4 animate-spin"
                          />
                        ) : (
                          <CareIcon icon="l-times" className="mr-1 size-4" />
                        )}
                        {t("cancel")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject_transfer")}</DialogTitle>
            <DialogDescription>
              {t("reject_transfer_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">{t("transfer_amount")}</p>
              <p className="text-xl font-bold">
                {selectedTransfer && formatCurrency(selectedTransfer.amount)}
              </p>
              <p className="text-sm text-gray-500">
                {t("from")} {selectedTransfer?.from_user_name}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                {t("reject_reason_optional")}
              </Label>
              <Input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("enter_reason")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <>
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 size-4 animate-spin"
                  />
                  {t("rejecting")}
                </>
              ) : (
                t("reject_transfer")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
