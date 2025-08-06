import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  PAYMENT_RECONCILIATION_OUTCOME_COLORS,
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

const methodMap: Record<PaymentReconciliationPaymentMethod, string> = {
  cash: "Cash",
  ccca: "Credit Card",
  cchk: "Credit Check",
  cdac: "Credit Account",
  chck: "Check",
  ddpo: "Direct Deposit",
  debc: "Debit Card",
};

// Helper for friendly display of enum values
function humanize(str: string): string {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
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

  const { data: payment, isLoading } = useQuery({
    queryKey: ["paymentReconciliation", paymentReconciliationId],
    queryFn: query(paymentReconciliationApi.retrievePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
    enabled: !!paymentReconciliationId,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: mutate(paymentReconciliationApi.updatePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
    onSuccess: () => {
      toast.success(t("payment_status_updated"));
      queryClient.invalidateQueries({
        queryKey: ["paymentReconciliation", paymentReconciliationId],
      });
    },
  });

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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="p-2 h-auto"
            onClick={() => goBack(`/facility/${facilityId}/billing/payments`)}
          >
            <CareIcon icon="l-arrow-left" className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center flex-wrap gap-2">
              {t("payment")}
            </h1>
            <span className="text-sm text-gray-500">#{payment.id}</span>
            <div className="flex gap-2 mt-1 flex-wrap">
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
              <Badge variant="outline">{t(methodMap[payment.method])}</Badge>
              <Badge variant="outline">{t(payment.reconciliation_type)}</Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link
            href={`/facility/${facilityId}/billing/payments/${paymentReconciliationId}/print`}
          >
            <CareIcon icon="l-print" className="mr-2 size-4" />
            {t("print_receipt")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left & Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t("payment_details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Amount section */}
                <div className="md:col-span-3">
                  <div className="flex justify-between items-center py-3 border-b">
                    <div className="text-gray-500">{t("amount")}</div>
                    <MonetaryDisplay
                      className="text-xl font-bold"
                      amount={payment.amount}
                    />
                  </div>
                </div>

                {/* Left column */}
                <div>
                  <InfoItem
                    label={t("payment_date")}
                    value={
                      payment.payment_datetime
                        ? format(new Date(payment.payment_datetime), "PPP")
                        : null
                    }
                  />
                  <InfoItem
                    label={t("payment_method")}
                    value={methodMap[payment.method]}
                  />
                  {payment.reference_number && (
                    <InfoItem
                      label={t("reference_number")}
                      value={payment.reference_number}
                    />
                  )}
                </div>

                {/* Middle column */}
                <div>
                  <InfoItem
                    label={t("reconciliation_type")}
                    value={humanize(payment.reconciliation_type)}
                  />
                  <InfoItem label={t("kind")} value={humanize(payment.kind)} />
                  <InfoItem
                    label={t("issuer_type")}
                    value={humanize(payment.issuer_type)}
                  />
                </div>

                {/* Right column */}
                <div>
                  <InfoItem
                    label={t("status")}
                    value={
                      <Badge
                        variant={
                          PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]
                        }
                      >
                        {t(payment.status)}
                      </Badge>
                    }
                  />
                  <InfoItem
                    label={t("outcome")}
                    value={
                      <Badge
                        variant={
                          PAYMENT_RECONCILIATION_OUTCOME_COLORS[payment.outcome]
                        }
                      >
                        {t(payment.outcome)}
                      </Badge>
                    }
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
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-3">
                        {t("cash_transaction_details")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {payment.tendered_amount != null && (
                          <InfoItem
                            label={t("amount_tendered")}
                            value={
                              <MonetaryDisplay
                                amount={payment.tendered_amount}
                              />
                            }
                          />
                        )}
                        {payment.returned_amount != null && (
                          <InfoItem
                            label={t("change_returned")}
                            value={
                              <MonetaryDisplay
                                amount={payment.returned_amount}
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
                  <div className="pt-2">
                    <h3 className="text-sm font-medium mb-2">{t("notes")}</h3>
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
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
                        amount={String(payment.target_invoice.total_gross)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/invoices/${payment.target_invoice.id}`}
                    >
                      <CareIcon icon="l-eye" className="mr-2 size-4" />
                      {t("view_invoice")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/invoice/${payment.target_invoice.id}/print`}
                    >
                      <CareIcon icon="l-print" className="mr-2 size-4" />
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
                      ? format(new Date(payment.payment_datetime), "PPP")
                      : format(new Date(), "PPP")}
                  </p>
                </div>
                {payment.status === "cancelled" && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-2 size-2 rounded-full bg-destructive" />
                    <p className="font-medium">{t("payment_cancelled")}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(), "PPP")}
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
                  >
                    <CareIcon icon="l-print" className="mr-2 size-4" />
                    {t("print_receipt")}
                  </Link>
                </Button>
                {payment.target_invoice && (
                  <Button className="w-full" variant="outline" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/invoices/${payment.target_invoice.id}`}
                    >
                      <CareIcon icon="l-eye" className="mr-2 size-4" />
                      {t("view_invoice")}
                    </Link>
                  </Button>
                )}
                {payment.status !== PaymentReconciliationStatus.cancelled &&
                  payment.status !==
                    PaymentReconciliationStatus.entered_in_error && (
                    <>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          updatePaymentMutation.mutate({
                            ...payment,
                            status: PaymentReconciliationStatus.cancelled,
                          })
                        }
                        disabled={updatePaymentMutation.isPending}
                      >
                        <CareIcon icon="l-ban" className="mr-2 size-4" />
                        {t("mark_as_cancelled")}
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          updatePaymentMutation.mutate({
                            ...payment,
                            status:
                              PaymentReconciliationStatus.entered_in_error,
                          })
                        }
                        disabled={updatePaymentMutation.isPending}
                      >
                        <CareIcon
                          icon="l-exclamation-triangle"
                          className="mr-2 size-4"
                        />
                        {t("mark_as_entered_in_error")}
                      </Button>
                    </>
                  )}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    goBack(`/facility/${facilityId}/billing/payments`)
                  }
                >
                  <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
                  {t("back_to_payments")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentReconciliationShow;
