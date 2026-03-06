import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  BanIcon,
  ExternalLink,
  Eye,
  PrinterIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Link } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";

import CriticalActionConfirmationDialog from "@/components/Common/CriticalActionConfirmationDialog";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useAppHistory from "@/hooks/useAppHistory";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PAYMENT_RECONCILIATION_OUTCOME_COLORS,
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

// Helper for friendly display of enum values
function humanize(str: string): string {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}

export function PaymentReconciliationShow({
  facilityId,
  paymentReconciliationId,
}: {
  facilityId: string;
  paymentReconciliationId: string;
}) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  useShortcutSubContext("facility:payment");

  const { data: payment, isLoading } = useQuery({
    queryKey: ["paymentReconciliation", paymentReconciliationId],
    queryFn: query(paymentReconciliationApi.retrievePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
    enabled: !!paymentReconciliationId,
  });

  const { mutate: cancelPayment, isPending } = useMutation({
    mutationFn: mutate(paymentReconciliationApi.cancelPaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
    onSuccess: () => {
      toast.success(t("payment_status_updated"));
      queryClient.invalidateQueries({
        queryKey: ["paymentReconciliation", paymentReconciliationId],
      });
      setCancelDialogOpen(false);
      setErrorDialogOpen(false);
    },
  });

  const handleCancelPayment = () => {
    cancelPayment({
      reason: PaymentReconciliationStatus.cancelled,
    });
  };

  const handleMarkAsError = () => {
    cancelPayment({
      reason: PaymentReconciliationStatus.entered_in_error,
    });
  };

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!payment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("payment_not_found")}</h2>
          <p className="mt-2 text-gray-600">{t("payment_may_not_exist")}</p>
          <Button asChild className="mt-4">
            <Link href={`/facility/${facilityId}/billing/payments`}>
              {t("back_to_payments")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t(payment.is_credit_note ? "refund" : "payment")}
            <span className="text-lg font-normal text-gray-500">
              #{payment.id}
            </span>
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              variant={PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]}
            >
              {t(payment.status)}
            </Badge>
            <Badge
              variant={PAYMENT_RECONCILIATION_OUTCOME_COLORS[payment.outcome]}
            >
              {t(payment.outcome)}
            </Badge>
            <Badge variant="outline">
              {t(PAYMENT_RECONCILIATION_METHOD_MAP[payment.method])}
            </Badge>
            <Badge variant="outline">{t(payment.reconciliation_type)}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/facility/${facilityId}/billing/payments/${paymentReconciliationId}/print`}
            >
              <PrinterIcon className="size-4" />
              {t("print_receipt")}
              <ShortcutBadge actionId="print-payment-receipt" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left & Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information Card */}
          {payment.account?.patient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  {t("patient_information")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      {t("patient_name")}
                    </div>
                    <div className="font-semibold text-lg">
                      {payment.account.patient.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{t("age")}</div>
                    <div className="font-medium">
                      {formatPatientAge(payment.account.patient, true)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{t("sex")}</div>
                    <div className="font-medium">
                      {payment.account.patient.gender
                        ? t(`GENDER__${payment.account.patient.gender}`)
                        : "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Amount Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {t(
                      payment.is_credit_note
                        ? "refund_amount"
                        : "payment_amount",
                    )}
                  </div>
                  <MonetaryDisplay
                    className="text-3xl font-bold"
                    amount={payment.amount}
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">
                    {t("payment_date")}
                  </div>
                  <div className="font-medium">
                    {payment.payment_datetime
                      ? format(new Date(payment.payment_datetime), "PPP p")
                      : "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t("payment_details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoItem
                    label={t("payment_method")}
                    value={PAYMENT_RECONCILIATION_METHOD_MAP[payment.method]}
                  />
                  {payment.reference_number && (
                    <InfoItem
                      label={t("reference_number")}
                      value={payment.reference_number}
                    />
                  )}
                  {payment.location && (
                    <InfoItem
                      label={t("location")}
                      value={payment.location.name}
                    />
                  )}
                </div>

                {/* Middle column */}
                <div>
                  <InfoItem
                    label={t("reconciliation_type")}
                    value={humanize(payment.reconciliation_type)}
                  />
                </div>
                <div className="space-y-4">
                  <InfoItem label={t("kind")} value={humanize(payment.kind)} />
                  <InfoItem
                    label={t("issuer_type")}
                    value={humanize(payment.issuer_type)}
                  />
                  {payment.disposition && (
                    <InfoItem
                      label={t("disposition")}
                      value={payment.disposition}
                    />
                  )}
                </div>
              </div>

              {/* Cash payment details */}
              {payment.method === "cash" &&
                (payment.tendered_amount != null ||
                  payment.returned_amount != null) && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        {t("cash_transaction_details")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {payment.tendered_amount != null && (
                          <InfoItem
                            label={t("amount_tendered")}
                            value={
                              <MonetaryDisplay
                                amount={payment.tendered_amount}
                                className="text-lg font-semibold"
                              />
                            }
                          />
                        )}
                        {!payment.is_credit_note &&
                          payment.returned_amount != null && (
                            <InfoItem
                              label={t("change_returned")}
                              value={
                                <MonetaryDisplay
                                  amount={payment.returned_amount}
                                  className="text-lg font-semibold"
                                />
                              }
                            />
                          )}
                      </div>
                    </div>
                  </>
                )}

              {/* Notes */}
              {payment.note && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-sm font-medium mb-3">{t("notes")}</h3>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm">
                      {payment.note}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Related Invoice Card */}
          {payment.target_invoice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t("related_invoice")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/facility/${facilityId}/billing/invoices/${payment.target_invoice.id}`}
                        className="text-lg font-medium text-primary hover:underline"
                      >
                        {t("view_invoice")}
                      </Link>
                      <Badge variant="outline">
                        {payment.target_invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {payment.target_invoice.number} (#
                      {payment.target_invoice.id})
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      {t("invoice_amount")}
                    </div>
                    <div className="font-bold">
                      <MonetaryDisplay
                        amount={payment.target_invoice.total_gross}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/invoices/${payment.target_invoice.id}`}
                    >
                      <Eye className="size-4" />
                      {t("view_invoice")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/invoice/${payment.target_invoice.id}/print`}
                    >
                      <PrinterIcon className="size-4" />
                      {t("print_invoice")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right */}
        <div className="space-y-6">
          {/* Payment Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t("payment_timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-2 size-2 rounded-full bg-primary" />
                  <p className="font-medium">{t("payment_recorded")}</p>
                  <p className="text-sm text-gray-500">
                    {payment.payment_datetime
                      ? format(new Date(payment.payment_datetime), "PPP p")
                      : format(new Date(), "PPP p")}
                  </p>
                </div>
                {payment.status === "cancelled" && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-2 size-2 rounded-full bg-destructive" />
                    <p className="font-medium">{t("payment_cancelled")}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(), "PPP p")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t("actions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <Link
                    href={`/facility/${facilityId}/billing/payments/${paymentReconciliationId}/print`}
                    className="flex items-center w-full relative"
                  >
                    <PrinterIcon className="size-4" />
                    {t("print_receipt")}
                  </Link>
                </Button>
                {payment.target_invoice && (
                  <Button className="w-full" variant="outline" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/invoices/${payment.target_invoice.id}`}
                      className="flex items-center w-full relative"
                    >
                      <Eye className="size-4" />
                      {t("view_invoice")}
                      <ShortcutBadge actionId="view-invoice" />
                    </Link>
                  </Button>
                )}
                {payment.status !== PaymentReconciliationStatus.cancelled &&
                  payment.status !==
                    PaymentReconciliationStatus.entered_in_error && (
                    <>
                      <CriticalActionConfirmationDialog
                        trigger={
                          <Button
                            className="w-full flex items-center relative"
                            variant="outline"
                            disabled={isPending}
                          >
                            <BanIcon className="size-4" />
                            {t("mark_as_cancelled")}
                            <ShortcutBadge actionId="mark-payment-cancelled" />
                          </Button>
                        }
                        title={t("confirm_cancel_payment")}
                        description={
                          <>
                            <p>{t("cancel_payment_confirmation_message")}</p>
                            <p className="mt-3 font-semibold">
                              {t("this_action_cannot_be_undone")}
                            </p>
                          </>
                        }
                        confirmationText={t("cancel_payment_confirmation_text")}
                        actionButtonText={t("proceed")}
                        onConfirm={handleCancelPayment}
                        isLoading={isPending}
                        open={cancelDialogOpen}
                        onOpenChange={setCancelDialogOpen}
                        variant="destructive"
                        icon={<BanIcon className="size-4 text-red-500" />}
                      />
                      <CriticalActionConfirmationDialog
                        trigger={
                          <Button
                            className="w-full flex items-center relative"
                            variant="outline"
                            disabled={isPending}
                          >
                            <TriangleAlertIcon className="size-4" />
                            {t("mark_as_entered_in_error")}
                            <ShortcutBadge actionId="mark-payment-error" />
                          </Button>
                        }
                        title={t("confirm_mark_as_error")}
                        description={
                          <>
                            <p>{t("mark_as_error_confirmation_message")}</p>
                            <p className="mt-3 font-semibold">
                              {t("this_action_cannot_be_undone")}
                            </p>
                          </>
                        }
                        confirmationText={t("mark_as_error_confirmation_text")}
                        actionButtonText={t("proceed")}
                        onConfirm={handleMarkAsError}
                        isLoading={isPending}
                        open={errorDialogOpen}
                        onOpenChange={setErrorDialogOpen}
                        variant="destructive"
                        icon={
                          <TriangleAlertIcon className="size-4 text-red-500" />
                        }
                      />
                    </>
                  )}
                <Button
                  className="w-full flex items-center relative"
                  variant="outline"
                  onClick={() =>
                    goBack(`/facility/${facilityId}/billing/payments`)
                  }
                  data-shortcut-id="go-back"
                >
                  <ArrowLeft className="size-4" />
                  {t("back_to_payments")}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={`/facility/${facilityId}/billing/account/${payment.account?.id}`}
                  >
                    <ExternalLink className="size-4" />
                    {t("view_account")}
                    <ShortcutBadge actionId="view-account" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 p-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                {t("created_by")}
              </div>
              <div className="text-sm font-medium">
                {formatName(payment.created_by)}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(payment.created_date), "PPP p")}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">
                {t("last_modified_by")}
              </div>
              <div className="text-sm font-medium">
                {formatName(payment.updated_by)}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(payment.modified_date), "PPP p")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentReconciliationShow;
