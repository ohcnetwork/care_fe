import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Download,
  History,
  Inbox,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [historyTab, setHistoryTab] = useState<"sent" | "received">("sent");

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

  // Get sent transfers from this counter (only when sent tab is active)
  const { data: sentResponse, isLoading: isLoadingSent } = useQuery({
    queryKey: ["cash-transfers-sent", session.counter_x_care_id, session.id],
    queryFn: query(cashTransferApi.getSentTransfers, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        counter_x_care_id: session.counter_x_care_id,
        from_session_id: session.id,
      },
    }),
    enabled: historyTab === "sent",
  });

  // Get received transfers to this session (only when received tab is active)
  const { data: receivedResponse, isLoading: isLoadingReceived } = useQuery({
    queryKey: [
      "cash-transfers-received",
      session.counter_x_care_id,
      session.id,
    ],
    queryFn: query(cashTransferApi.getSentTransfers, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        counter_x_care_id: session.counter_x_care_id,
        to_session_id: session.id,
      },
    }),
    enabled: historyTab === "received",
  });

  const incomingTransfers = incomingResponse?.transfers ?? [];
  const sentTransfers = sentResponse?.transfers ?? [];
  const receivedTransfers = receivedResponse?.transfers ?? [];

  const { mutate: acceptTransfer, isPending: isAccepting } = useMutation({
    mutationFn: (transferId: number) =>
      mutate(cashTransferApi.acceptTransfer, {
        pathParams: {
          facilityId: facilityId,
          transferId: transferId.toString(),
        },
      })({
        counter_x_care_id: session.counter_x_care_id,
        session_id: session.id.toString(),
      }),
    onSuccess: () => {
      toast.success(t("transfer_accepted"));
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-pending"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-sent"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-received"] });
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
        session_id: session.id.toString(),
        reason: data.reason,
      }),
    onSuccess: () => {
      toast.success(t("transfer_rejected"));
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-pending"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-sent"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-received"] });
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
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-received"] });
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

  if (isLoadingIncoming) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const hasIncoming = incomingTransfers.length > 0;

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
                    <Inbox className="size-5 text-amber-600" />
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
                      <ArrowRight className="size-4 text-gray-400" />
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
                      <X className="mr-1 size-4" />
                      {t("reject")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptTransfer(transfer.id)}
                      disabled={isAccepting || isRejecting}
                    >
                      {isAccepting ? (
                        <Loader2 className="mr-1 size-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 size-4" />
                      )}
                      {t("accept")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Transfer History (Sent/Received) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-5 text-gray-600" />
                  {t("transfer_history")}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t("transfer_history_description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs
              value={historyTab}
              onValueChange={(value) =>
                setHistoryTab(value as "sent" | "received")
              }
            >
              <TabsList>
                <TabsTrigger
                  value="sent"
                  className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
                >
                  <Upload className="mr-1.5 size-4" />
                  {t("sent")} ({sentTransfers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="received"
                  className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
                >
                  <Download className="mr-1.5 size-4" />
                  {t("received")} ({receivedTransfers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sent" className="mt-4 space-y-3">
                {isLoadingSent ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : sentTransfers.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {t("no_sent_transfers")}
                  </p>
                ) : (
                  sentTransfers.map((transfer: TransferData) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between rounded-lg border bg-gray-50/50 p-4"
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
                              <Loader2 className="mr-1 size-4 animate-spin" />
                            ) : (
                              <X className="mr-1 size-4" />
                            )}
                            {t("cancel")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="received" className="mt-4 space-y-3">
                {isLoadingReceived ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : receivedTransfers.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {t("no_received_transfers")}
                  </p>
                ) : (
                  receivedTransfers.map((transfer: TransferData) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between rounded-lg border bg-gray-50/50 p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{t("from")}</span>
                          <span className="font-medium">
                            {transfer.from_counter_name}
                          </span>
                          {transfer.from_user_name && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">
                                {transfer.from_user_name}
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
                          {t("received")}:{" "}
                          {formatDateTime(
                            transfer.resolved_at || transfer.created_at,
                          )}
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
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
                  <Loader2 className="mr-2 size-4 animate-spin" />
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
