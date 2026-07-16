import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import {
  BadgeCheckIcon,
  BadgeIndianRupeeIcon,
  BanIcon,
  BanknoteIcon,
  CheckCircleIcon,
  ChevronDown,
  CircleIcon,
  EqualApproximatelyIcon,
  LinkIcon,
  PrinterIcon,
  ReceiptIcon,
  ReceiptIndianRupeeIcon,
  SendIcon,
} from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Skeleton } from "@/components/ui/skeleton";

import { PaymentReconciliationSheet } from "@/pages/Facility/billing/PaymentReconciliationSheet";

import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { PaymentReconciliationStatus } from "@/types/billing/paymentReconciliation/paymentReconciliation";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { DottedDivider } from "@/components/careui/dotted-divider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const computePaidAndDueAmount = (invoice?: InvoiceRead) => {
  if (!invoice) {
    return {
      actualPaidAmount: "0",
      amountDue: "0",
    };
  }

  if (!invoice.payments.length) {
    return {
      actualPaidAmount: "0",
      amountDue: invoice.total_gross?.toString() || "0",
    };
  }
  const payments = invoice.payments.filter(
    (p) => p.status === PaymentReconciliationStatus.active,
  );

  const actualPaidAmount = payments
    .reduce((sum, p) => sum.plus(p.amount || 0), new Decimal(0))
    .toString();

  const amountDue = new Decimal(invoice.total_gross || 0)
    .minus(actualPaidAmount)
    .toString();

  return {
    actualPaidAmount,
    amountDue,
  };
};

const sumTotalPrices = (items: ChargeItemRead[]) => {
  return items
    .reduce((sum, item) => sum.plus(item.total_price || 0), new Decimal(0))
    .toString();
};

interface Props {
  facilityId: string;
  accountId?: string;
  invoiceId?: string;
  unbilledItems: ChargeItemRead[];
  onCreateInvoice?: (items: ChargeItemRead[]) => void;
  isCreatingInvoice?: boolean;
  onPaymentSuccess: () => void;
  /**
   * When true, disables invoice mutations (create invoice / issue invoice).
   * Use when the parent dispense order is in a final status and should not
   * allow new billing actions.
   */
  readOnly?: boolean;
}

/**
 * Skeleton placeholder shown while the invoice details are being fetched.
 * Mirrors the layout of the issued/balanced banner so the swap-in is smooth.
 */
function PaymentStatusBannerSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("loading")}
      className="border border-gray-200 rounded-md p-1 pt-2 bg-gray-50"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pl-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {/* Body row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 bg-white rounded-md p-3 shadow-xs">
        {/* Status block */}
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Amounts */}
        <div className="flex items-center gap-6 flex-wrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 lg:ml-auto flex-wrap">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function PaymentStatusBanner({
  facilityId,
  accountId,
  invoiceId,
  unbilledItems,
  onCreateInvoice,
  isCreatingInvoice = false,
  onPaymentSuccess,
  readOnly = false,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [cancelInvoiceDialogOpen, setCancelInvoiceDialogOpen] = useState(false);
  const [markBalancedDialogOpen, setMarkBalancedDialogOpen] = useState(false);

  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ["invoice", facilityId, invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId: invoiceId ?? "" },
    }),
    enabled: !!invoiceId,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["invoice"] });
  };

  const { mutate: issueInvoice, isPending: isIssuingInvoice } = useMutation({
    mutationFn: invoiceId
      ? mutate(invoiceApi.updateInvoice, {
          pathParams: { facilityId, invoiceId },
        })
      : async () => undefined,
    onSuccess: () => {
      toast.success(t("invoice_issued_successfully"));
      invalidateQueries();
      onPaymentSuccess();
    },
  });

  const { mutate: markAsBalanced, isPending: isMarkingBalanced } = useMutation({
    mutationFn: invoiceId
      ? mutate(invoiceApi.updateInvoice, {
          pathParams: { facilityId, invoiceId },
        })
      : async () => undefined,
    onSuccess: () => {
      toast.success(t("invoice_marked_as_balanced"));
      invalidateQueries();
      onPaymentSuccess();
    },
  });

  const { mutate: cancelInvoice, isPending: isCancellingInvoice } = useMutation(
    {
      mutationFn: invoiceId
        ? mutate(invoiceApi.cancelInvoice, {
            pathParams: { facilityId, invoiceId },
          })
        : async () => undefined,
      onSuccess: () => {
        toast.success(t("invoice_cancelled_successfully"));
        invalidateQueries();
        onPaymentSuccess();
      },
    },
  );

  const unbilledTotal = sumTotalPrices(unbilledItems);
  const { actualPaidAmount, amountDue } = computePaidAndDueAmount(invoice);

  const isFullyPaid = !!invoice && new Decimal(amountDue).lessThanOrEqualTo(0);
  const isBalanced = invoice?.status === InvoiceStatus.balanced;
  // Positive/settled state: either fully paid or manually balanced.
  const isSettled = isFullyPaid || isBalanced;
  const hasPayments = invoice?.payments && invoice.payments.length > 0;

  const handleIssueInvoice = () => {
    if (!invoice) return;
    issueInvoice({
      status: InvoiceStatus.issued,
      payment_terms: invoice.payment_terms,
      note: invoice.note,
      account: invoice.account?.id || "",
      charge_items: invoice.charge_items?.map((item) => item.id) || [],
      issue_date: new Date().toISOString(),
    });
  };

  const handleMarkAsBalanced = () => {
    if (!invoice) return;
    markAsBalanced({
      status: InvoiceStatus.balanced,
      payment_terms: invoice.payment_terms,
      note: invoice.note,
      account: invoice.account?.id || "",
      charge_items: invoice.charge_items?.map((item) => item.id) || [],
    });
  };

  const cashPayment = invoice?.payments?.find(
    (p) => p.status === PaymentReconciliationStatus.active,
  );

  // Invoice is still being fetched — show a skeleton placeholder.
  if (invoiceId && isLoadingInvoice) {
    return <PaymentStatusBannerSkeleton />;
  }

  // No invoice exists yet — show "Create Invoice" CTA if there are billable items
  if (!invoice) {
    if (unbilledItems.length === 0) return null;
    if (readOnly) return null;
    return (
      <div className="border border-amber-200 bg-amber-50 rounded-md p-3">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex items-center gap-3">
            <ReceiptIndianRupeeIcon className="size-6 text-amber-600" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-gray-900">
                  {t("invoice_not_generated")}
                </h3>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-gray-600">{t("amount_due")}:</span>
                <MonetaryDisplay
                  amount={unbilledTotal}
                  className="font-bold text-gray-900"
                />
                <span className="text-gray-500">
                  ({unbilledItems.length}{" "}
                  {unbilledItems.length === 1 ? t("item") : t("items")})
                </span>
              </div>
            </div>
          </div>
          {accountId && onCreateInvoice && (
            <Button
              variant="primary"
              onClick={() => onCreateInvoice(unbilledItems)}
              disabled={isCreatingInvoice}
            >
              {t("create_invoice")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Draft invoice — show Issue Invoice CTA
  if (invoice.status === InvoiceStatus.draft) {
    return (
      <div className="border border-gray-200 bg-gray-50 rounded-md p-3">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-gray-900">
                  {t("draft_invoice")}
                </h3>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm">
                <span className="text-gray-600">{t("invoice_total")}:</span>
                <MonetaryDisplay
                  amount={invoice.total_gross}
                  className="font-bold text-gray-900"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link
                basePath="/"
                href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
              >
                <ReceiptIcon className="size-4" />
                {t("view_invoice")}
              </Link>
            </Button>
            {!readOnly && (
              <Button
                variant="primary"
                onClick={handleIssueInvoice}
                disabled={isIssuingInvoice}
              >
                <SendIcon className="size-4" />
                {t("issue_invoice")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Issued / Balanced — main banner
  const bannerStyle = isSettled
    ? "border-primary-300 bg-primary-50"
    : "border-orange-200 bg-orange-50";

  return (
    <>
      <div className={`border rounded-md p-1 pt-2 ${bannerStyle}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="pl-3 text-base font-medium text-gray-900">
            {t("payment_status")}
          </h3>
          {isFullyPaid ? (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-200 gap-1"
            >
              <CheckCircleIcon className="size-3" />
              {t("fully_paid")}
            </Badge>
          ) : isBalanced ? (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-200 gap-1"
            >
              <EqualApproximatelyIcon className="size-3" />
              {t("balanced")}
            </Badge>
          ) : (
            <Badge variant="orange">
              <CircleIcon className="size-3" />
              {t("payment_pending")}
            </Badge>
          )}
        </div>

        {/* Body row */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6 bg-white rounded-md p-3 shadow-xs">
          {/* Status block */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {isSettled ? (
                <BadgeIndianRupeeIcon
                  className="size-8 text-green-600 shrink-0 bg-primary-100 rounded p-px"
                  strokeWidth={1.5}
                />
              ) : (
                <ReceiptIndianRupeeIcon
                  className="size-8 text-orange-600 shrink-0"
                  strokeWidth={1}
                />
              )}
              <div className="flex flex-col">
                <span
                  className={cn(
                    "font-semibold",
                    isSettled ? "text-green-800" : "text-orange-700",
                  )}
                >
                  {isFullyPaid && cashPayment
                    ? t("cash_collected")
                    : isBalanced
                      ? t("invoice_balanced")
                      : t("invoice_generated")}
                </span>
                <span className="text-xs text-gray-700 font-medium">
                  {format(
                    isFullyPaid && cashPayment?.payment_datetime
                      ? cashPayment.payment_datetime
                      : invoice.issue_date || invoice.created_date,
                    "PPp",
                  )}
                </span>
              </div>
            </div>
            <DottedDivider
              className={isSettled ? "text-green-800" : "text-orange-700"}
            />
          </div>

          {/* Amounts */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex flex-col">
              <span className="text-gray-600">{t("invoice_total")}:</span>
              <MonetaryDisplay
                amount={invoice.total_gross}
                className="text-xl font-bold text-gray-900"
              />
            </div>
            {hasPayments && (
              <>
                <div className="w-px h-11 bg-gray-200" />
                <div className="flex flex-col">
                  <span className="text-gray-600">{t("amount_paid")}:</span>
                  <div className="flex items-center gap-1">
                    <MonetaryDisplay
                      amount={actualPaidAmount}
                      className={cn(
                        "text-xl font-bold",
                        isSettled ? "text-green-900" : "text-orange-900",
                      )}
                    />
                    {isFullyPaid && (
                      <BadgeCheckIcon className="size-6 text-primary-600 bg-primary-100 rounded-full" />
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="w-px h-11 bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-gray-600">{t("amount_due")}:</span>
              <MonetaryDisplay
                amount={amountDue}
                className={cn(
                  "text-xl font-bold",
                  isSettled ? "text-gray-900" : "text-orange-900",
                )}
              />
            </div>
          </div>

          {/* Actions (right aligned) */}
          <div className="flex items-center gap-2 lg:ml-auto flex-wrap my-auto">
            {isSettled ? (
              <>
                <Button variant="outline" asChild>
                  <Link
                    href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                    basePath="/"
                  >
                    <PrinterIcon className="size-4" />
                    {t("print_receipt")}
                  </Link>
                </Button>
                {invoice.status === InvoiceStatus.issued && (
                  <Button
                    variant="primary"
                    onClick={handleMarkAsBalanced}
                    disabled={isMarkingBalanced}
                  >
                    <EqualApproximatelyIcon className="size-4" />
                    {t("mark_as_balanced")}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CareIcon icon="l-ellipsis-v" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        basePath="/"
                        href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                      >
                        <ReceiptIcon className="size-4" />
                        {t("view_invoice")}
                      </Link>
                    </DropdownMenuItem>
                    {accountId && (
                      <DropdownMenuItem asChild>
                        <Link
                          basePath="/"
                          href={`/facility/${facilityId}/billing/account/${accountId}`}
                        >
                          <BanknoteIcon className="size-4" />
                          {t("go_to_account")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link
                    href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                    basePath="/"
                  >
                    <PrinterIcon className="size-4" />
                    {t("invoice")}
                  </Link>
                </Button>
                {accountId && (
                  <div className="flex">
                    <Button
                      variant="primary"
                      className="rounded-r-none"
                      onClick={() => setPaymentSheetOpen(true)}
                    >
                      <BanknoteIcon className="size-4" />
                      {t("collect_payment")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="primary"
                          size="icon"
                          className="rounded-l-none border-l border-l-white/20"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setMarkBalancedDialogOpen(true)}
                        >
                          <EqualApproximatelyIcon className="size-4" />
                          {t("mark_as_balanced")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            basePath="/"
                            href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                          >
                            <LinkIcon className="size-4" />
                            {t("view_invoice")}
                          </Link>
                        </DropdownMenuItem>
                        {accountId && (
                          <DropdownMenuItem asChild>
                            <Link
                              basePath="/"
                              href={`/facility/${facilityId}/billing/account/${accountId}`}
                            >
                              <BanknoteIcon className="size-4" />
                              {t("go_to_account")}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setCancelInvoiceDialogOpen(true)}
                          variant="destructive"
                        >
                          <BanIcon />
                          {t("cancel_invoice")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Sheet */}
      {accountId && (
        <PaymentReconciliationSheet
          open={paymentSheetOpen}
          onOpenChange={setPaymentSheetOpen}
          facilityId={facilityId}
          invoice={invoice}
          accountId={accountId}
          onSuccess={() => {
            onPaymentSuccess();
          }}
        />
      )}

      {/* Cancel Invoice Confirmation */}
      <AlertDialog
        open={cancelInvoiceDialogOpen}
        onOpenChange={setCancelInvoiceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancel_invoice")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancel_invoice_confirmation", {
                invoiceNumber: invoice.number,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingInvoice}>
              {t("no_go_back")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelInvoice({ reason: "cancelled" });
                setCancelInvoiceDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancellingInvoice ? t("cancelling") : t("yes_cancel_invoice")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Balanced Confirmation */}
      <AlertDialog
        open={markBalancedDialogOpen}
        onOpenChange={setMarkBalancedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mark_invoice_as_balanced")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mark_as_balanced_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingBalanced}>
              {t("no_go_back")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleMarkAsBalanced();
                setMarkBalancedDialogOpen(false);
              }}
              disabled={isMarkingBalanced}
            >
              <CheckCircleIcon className="size-4" />
              {t("yes_mark_as_balanced")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
