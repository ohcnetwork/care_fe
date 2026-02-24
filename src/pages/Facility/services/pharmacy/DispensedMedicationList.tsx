import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseCategory,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpdate,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useMemo, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { formatDosage, formatFrequency } from "@/components/Medicine/utils";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import ViewDefaultAccountButton from "@/pages/Facility/billing/account/ViewDefaultAccountButton";
import { PaymentReconciliationSheet } from "@/pages/Facility/billing/PaymentReconciliationSheet";
import batchApi from "@/types/base/batch/batchApi";
import accountApi from "@/types/billing/account/accountApi";
import {
  INVOICE_STATUS_COLORS,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PatientListRead } from "@/types/emr/patient/patient";

import { round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  ArrowUpRightSquare,
  BanknoteIcon,
  CheckCircleIcon,
  ClockIcon,
  PillIcon,
  PrinterIcon,
  ReceiptIcon,
  SendIcon,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Simplified Medication Table
interface MedicationTableProps {
  medications: MedicationDispenseRead[];
}

function MedicationTable({ medications }: MedicationTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateMedication } = useMutation({
    mutationFn: (body: MedicationDispenseUpdate) => {
      return mutate(medicationDispenseApi.update, {
        body: {
          status: body.status,
        },
        pathParams: {
          id: body.id,
        },
      })(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      toast.success(t("dispense_status_updated"));
    },
  });

  const editableStatuses = [
    MedicationDispenseStatus.preparation,
    MedicationDispenseStatus.in_progress,
    MedicationDispenseStatus.completed,
  ];

  const getStatusOptions = (charge_item?: ChargeItemRead) => {
    const statusOptions = [
      MedicationDispenseStatus.preparation,
      MedicationDispenseStatus.in_progress,
      MedicationDispenseStatus.completed,
    ];
    if (
      !charge_item ||
      !charge_item?.paid_invoice ||
      charge_item?.paid_invoice?.status === InvoiceStatus.draft
    ) {
      statusOptions.push(MedicationDispenseStatus.declined);
    }
    return statusOptions;
  };

  return (
    <div className="overflow-hidden rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="text-gray-700 font-semibold">
              {t("medication")}
            </TableHead>
            <TableHead className="text-gray-700 font-semibold w-24">
              {t("quantity")}
            </TableHead>
            <TableHead className="text-gray-700 font-semibold w-40">
              {t("status")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((medication) => {
            const instruction = medication.dosage_instruction?.[0];

            const dosageText = formatDosage(instruction) || null;
            const frequencyText = formatFrequency(instruction);

            const batchNumber = medication.item.product.batch?.lot_number;
            const expiryDate = medication.item.product.expiration_date;

            return (
              <TableRow key={medication.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-900 font-medium">
                      {medication.item.product.product_knowledge.name}
                    </span>
                    {(dosageText || frequencyText) && (
                      <span className="text-sm text-gray-500">
                        {[dosageText, frequencyText]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    {(batchNumber || expiryDate) && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {batchNumber && (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-400">{t("batch")}:</span>
                            <span className="font-medium text-gray-600">
                              {batchNumber}
                            </span>
                          </span>
                        )}
                        {expiryDate && (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-400">
                              {t("expiry")}:
                            </span>
                            <span
                              className={`font-medium ${
                                new Date(expiryDate) < new Date()
                                  ? "text-red-600"
                                  : new Date(expiryDate) <
                                      new Date(
                                        Date.now() + 90 * 24 * 60 * 60 * 1000,
                                      )
                                    ? "text-amber-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {new Date(expiryDate).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-900 font-medium">
                  {medication.quantity ? round(medication.quantity) : "-"}
                </TableCell>
                <TableCell>
                  {editableStatuses.includes(medication.status) ? (
                    <Select
                      value={medication.status.toString()}
                      onValueChange={(value) => {
                        updateMedication({
                          id: medication.id,
                          status: value as MedicationDispenseStatus,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatusOptions(medication?.charge_item).map(
                          (status) => {
                            return (
                              <SelectItem
                                key={status}
                                value={status.toString()}
                              >
                                {t(status)}
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={
                        MEDICATION_DISPENSE_STATUS_COLORS[medication.status]
                      }
                    >
                      {t(medication.status)}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Invoice Card Component
interface InvoiceCardProps {
  invoice: InvoiceRead;
  facilityId: string;
  accountId?: string;
  onIssueSuccess: () => void;
  onPaymentSuccess: () => void;
}

function InvoiceCard({
  invoice,
  facilityId,
  accountId,
  onIssueSuccess,
  onPaymentSuccess,
}: InvoiceCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [cancelInvoiceDialogOpen, setCancelInvoiceDialogOpen] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState<string | null>(null);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["invoice"] });
  };

  const { mutate: issueInvoice, isPending: isIssuingInvoice } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId: invoice.id },
    }),
    onSuccess: () => {
      toast.success(t("invoice_issued_successfully"));
      invalidateQueries();
      onIssueSuccess();
    },
    onError: () => {
      toast.error(t("failed_to_issue_invoice"));
    },
  });

  const { mutate: markAsBalanced, isPending: isMarkingBalanced } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId: invoice.id },
    }),
    onSuccess: () => {
      toast.success(t("invoice_marked_as_balanced"));
      invalidateQueries();
      onPaymentSuccess();
    },
    onError: () => {
      toast.error(t("failed_to_mark_invoice_as_balanced"));
    },
  });

  const { mutate: cancelInvoice, isPending: isCancellingInvoice } = useMutation(
    {
      mutationFn: mutate(invoiceApi.cancelInvoice, {
        pathParams: { facilityId, invoiceId: invoice.id },
      }),
      onSuccess: () => {
        toast.success(t("invoice_cancelled_successfully"));
        invalidateQueries();
        onPaymentSuccess();
      },
      onError: () => {
        toast.error(t("failed_to_cancel_invoice"));
      },
    },
  );

  const { mutate: cancelPayment, isPending: isCancellingPayment } = useMutation(
    {
      mutationFn: (paymentId: string) =>
        mutate(paymentReconciliationApi.cancelPaymentReconciliation, {
          pathParams: { facilityId, paymentReconciliationId: paymentId },
        })({ reason: PaymentReconciliationStatus.cancelled }),
      onSuccess: () => {
        toast.success(t("payment_cancelled_successfully"));
        invalidateQueries();
        onPaymentSuccess();
      },
      onError: () => {
        toast.error(t("failed_to_cancel_payment"));
      },
    },
  );

  const handleIssueInvoice = () => {
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
    markAsBalanced({
      status: InvoiceStatus.balanced,
      payment_terms: invoice.payment_terms,
      note: invoice.note,
      account: invoice.account?.id || "",
      charge_items: invoice.charge_items?.map((item) => item.id) || [],
    });
  };

  const handleCancelInvoice = () => {
    cancelInvoice({ reason: "cancelled" });
  };

  const getPaymentLabel = (payment: PaymentReconciliationRead) => {
    if (payment.method === PaymentReconciliationPaymentMethod.cash) {
      return t("cash_collected");
    }
    return PAYMENT_RECONCILIATION_METHOD_MAP[payment.method];
  };

  const getPaymentReference = (payment: PaymentReconciliationRead) => {
    if (payment.method === PaymentReconciliationPaymentMethod.cash) {
      return null;
    }
    return payment.reference_number;
  };

  // Calculate actual paid amount from active payments only (not cancelled ones)
  const actualPaidAmount = useMemo(() => {
    if (!invoice.payments) return "0";
    return invoice.payments
      .filter((p) => p.status === PaymentReconciliationStatus.active)
      .reduce((sum, p) => sum.plus(p.amount || 0), new Decimal(0))
      .toString();
  }, [invoice.payments]);

  const amountDue = useMemo(() => {
    return new Decimal(invoice.total_gross || 0)
      .minus(actualPaidAmount)
      .toString();
  }, [invoice.total_gross, actualPaidAmount]);

  const isFullyPaid = new Decimal(amountDue).lessThanOrEqualTo(0);

  const handlePaymentSuccess = () => {
    setPaymentSheetOpen(false);
    onPaymentSuccess();
  };

  const getStatusConfig = () => {
    switch (invoice.status) {
      case InvoiceStatus.draft:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          statusColor: "text-gray-600",
          icon: <ReceiptIcon className="size-5 text-gray-400" />,
        };
      case InvoiceStatus.issued:
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          statusColor: "text-blue-700",
          icon: <ReceiptIcon className="size-5 text-blue-500" />,
        };
      case InvoiceStatus.balanced:
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          statusColor: "text-green-700",
          icon: <CheckCircleIcon className="size-5 text-green-500" />,
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          statusColor: "text-gray-600",
          icon: <ReceiptIcon className="size-5 text-gray-400" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {config.icon}
              <div>
                <p className="font-semibold text-gray-900">{invoice.number}</p>
                <Badge
                  variant={INVOICE_STATUS_COLORS[invoice.status]}
                  className="mt-1"
                >
                  {t(invoice.status)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                  basePath="/"
                >
                  <PrinterIcon className="size-4" />
                  {t("print")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  basePath="/"
                  href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                >
                  <ArrowUpRightSquare className="size-4" />
                  {t("view")}
                </Link>
              </Button>
              {invoice.status !== InvoiceStatus.cancelled &&
                invoice.status !== InvoiceStatus.balanced && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isCancellingInvoice}
                      >
                        <CareIcon icon="l-ellipsis-v" className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setCancelInvoiceDialogOpen(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <CareIcon icon="l-times-circle" className="size-4" />
                        {t("cancel_invoice")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          </div>

          {/* Amount Details */}
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">{t("invoice_total")}</p>
              <MonetaryDisplay
                amount={invoice.total_gross}
                className="text-lg font-bold text-gray-900"
              />
            </div>
            {new Decimal(actualPaidAmount).greaterThan(0) && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-600">{t("amount_paid")}</p>
                <MonetaryDisplay
                  amount={actualPaidAmount}
                  className="font-semibold text-green-600"
                />
              </div>
            )}
            {invoice.status !== InvoiceStatus.draft && (
              <div className="flex justify-between items-center pt-2 border-t border-dashed">
                <p
                  className={`text-sm font-medium ${
                    isFullyPaid ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {t("amount_due")}
                </p>
                <MonetaryDisplay
                  amount={amountDue}
                  className={`font-bold ${
                    isFullyPaid ? "text-green-600" : "text-amber-600"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Payment History */}
          {invoice.payments &&
            invoice.payments.some(
              (p) => p.status === PaymentReconciliationStatus.active,
            ) && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t("payment_history")}
                </p>
                <div className="space-y-2">
                  {invoice.payments
                    .filter(
                      (payment) =>
                        payment.status === PaymentReconciliationStatus.active,
                    )
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-2 border border-green-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-8 rounded-full bg-green-100">
                            <CheckCircleIcon className="size-4 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {getPaymentLabel(payment)}
                              </span>
                              {getPaymentReference(payment) && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  Ref: {getPaymentReference(payment)}
                                </span>
                              )}
                            </div>
                            {payment.payment_datetime && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(
                                  payment.payment_datetime,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MonetaryDisplay
                            amount={payment.amount}
                            className="font-bold text-green-700"
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                disabled={isCancellingPayment}
                              >
                                <CareIcon
                                  icon="l-ellipsis-v"
                                  className="size-3"
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setCancelPaymentId(payment.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <CareIcon
                                  icon="l-times-circle"
                                  className="size-4"
                                />
                                {t("cancel_payment")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Actions based on status */}
          <div className="space-y-2">
            {invoice.status === InvoiceStatus.draft && (
              <Button
                onClick={handleIssueInvoice}
                disabled={isIssuingInvoice}
                className="w-full"
                variant="primary"
              >
                {isIssuingInvoice ? (
                  <>
                    <CareIcon
                      icon="l-spinner"
                      className="size-4 animate-spin"
                    />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4" />
                    {t("issue_invoice")}
                  </>
                )}
              </Button>
            )}

            {(invoice.status === InvoiceStatus.issued ||
              invoice.status === InvoiceStatus.balanced) &&
              accountId && (
                <div className="flex gap-2">
                  {isFullyPaid ? (
                    invoice.status === InvoiceStatus.issued ? (
                      <Button
                        onClick={handleMarkAsBalanced}
                        disabled={isMarkingBalanced}
                        className="w-full"
                        variant="primary"
                      >
                        {isMarkingBalanced ? (
                          <>
                            <CareIcon
                              icon="l-spinner"
                              className="size-4 animate-spin"
                            />
                            {t("processing")}
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="size-4" />
                            {t("mark_as_balanced")}
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2 w-full text-primary-700">
                        <CheckCircleIcon className="size-5" />
                        <span className="font-medium">
                          {t("payment_received")}
                        </span>
                      </div>
                    )
                  ) : (
                    <Button
                      onClick={() => setPaymentSheetOpen(true)}
                      className="w-full"
                      variant="primary"
                    >
                      <BanknoteIcon className="size-4" />
                      {t("collect_payment")}
                    </Button>
                  )}
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Sheet */}
      {accountId && (
        <PaymentReconciliationSheet
          open={paymentSheetOpen}
          onOpenChange={setPaymentSheetOpen}
          facilityId={facilityId}
          invoice={invoice}
          accountId={accountId}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Cancel Invoice Confirmation Dialog */}
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
            <AlertDialogCancel>{t("no_go_back")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleCancelInvoice();
                setCancelInvoiceDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancellingInvoice ? t("cancelling") : t("yes_cancel_invoice")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Payment Confirmation Dialog */}
      <AlertDialog
        open={!!cancelPaymentId}
        onOpenChange={(open) => !open && setCancelPaymentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancel_payment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancel_payment_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("no_go_back")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelPaymentId) {
                  cancelPayment(cancelPaymentId);
                  setCancelPaymentId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancellingPayment ? t("cancelling") : t("yes_cancel_payment")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Billing Summary Panel
interface BillingSummaryPanelProps {
  facilityId: string;
  patientId: string;
  medications: MedicationDispenseRead[];
  relatedInvoices: InvoiceRead[];
  accountId?: string;
  onPaymentSuccess: () => void;
  unbilledItems?: ChargeItemRead[];
  onCreateInvoice?: (items: ChargeItemRead[]) => void;
}

function BillingSummaryPanel({
  facilityId,
  patientId,
  medications: _medications,
  relatedInvoices,
  accountId,
  onPaymentSuccess,
  unbilledItems = [],
  onCreateInvoice,
}: BillingSummaryPanelProps) {
  const { t } = useTranslation();

  // Filter out cancelled invoices from active invoices
  const activeInvoices = useMemo(() => {
    return relatedInvoices.filter(
      (invoice) =>
        invoice.status !== InvoiceStatus.cancelled &&
        invoice.status !== InvoiceStatus.entered_in_error,
    );
  }, [relatedInvoices]);

  // Calculate totals from active invoices (using only active payments, not cancelled ones)
  const totals = useMemo(() => {
    let total = new Decimal(0);
    let paid = new Decimal(0);

    activeInvoices.forEach((invoice) => {
      // Add invoice total to overall total
      if (invoice.total_gross) {
        total = total.plus(invoice.total_gross);
      }
      // Sum only active payments (exclude cancelled/draft payments)
      if (invoice.payments) {
        invoice.payments
          .filter((p) => p.status === PaymentReconciliationStatus.active)
          .forEach((p) => {
            paid = paid.plus(p.amount || 0);
          });
      }
    });

    return {
      total: total.toString(),
      paid: paid.toString(),
      outstanding: total.minus(paid).toString(),
    };
  }, [activeInvoices]);

  // Calculate unbilled total (exclude cancelled/aborted items)
  const unbilledTotal = useMemo(() => {
    let total = new Decimal(0);
    unbilledItems.forEach((item) => {
      // Skip cancelled/aborted items
      if (
        item?.status === ChargeItemStatus.aborted ||
        item?.status === ChargeItemStatus.entered_in_error ||
        item?.status === ChargeItemStatus.not_billable
      ) {
        return;
      }
      if (item?.total_price) {
        total = total.plus(item.total_price);
      }
    });
    return total.toString();
  }, [unbilledItems]);

  const hasOutstanding = new Decimal(totals.outstanding).greaterThan(0);
  const hasUnbilledItems = unbilledItems.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("billing_summary")}
        </h2>
        <ViewDefaultAccountButton
          facilityId={facilityId}
          patientId={patientId}
          disabled={false}
        />
      </div>

      {/* Total Value */}
      {activeInvoices.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{t("total_value")}</p>
          <MonetaryDisplay
            amount={totals.total}
            className="text-lg font-bold text-gray-900"
          />
        </div>
      )}

      {/* Unbilled Items Section */}
      {hasUnbilledItems && (
        <Card className="bg-amber-50 border-amber-200 border-2">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="size-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {t("unbilled_items")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {unbilledItems.length}{" "}
                    {unbilledItems.length === 1 ? t("item") : t("items")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t("total_value")}</p>
                <MonetaryDisplay
                  amount={unbilledTotal}
                  className="font-bold text-amber-700"
                />
              </div>
            </div>
            {onCreateInvoice && accountId && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() =>
                  onCreateInvoice(unbilledItems as ChargeItemRead[])
                }
              >
                <ReceiptIcon className="size-4" />
                {t("create_invoice")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Status Indicator */}
      {activeInvoices.length > 0 && (
        <div
          className={`rounded-lg p-3 ${
            hasOutstanding
              ? "bg-amber-50 border border-amber-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasOutstanding ? (
                <ClockIcon className="size-5 text-amber-600" />
              ) : (
                <CheckCircleIcon className="size-5 text-green-600" />
              )}
              <span
                className={`font-medium ${hasOutstanding ? "text-amber-700" : "text-green-700"}`}
              >
                {hasOutstanding ? t("payment_pending") : t("fully_paid")}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {hasOutstanding ? t("amount_outstanding") : t("amount_paid")}
              </p>
              <MonetaryDisplay
                amount={hasOutstanding ? totals.outstanding : totals.paid}
                className={`font-bold ${hasOutstanding ? "text-amber-700" : "text-green-700"}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Invoice Cards */}
      {activeInvoices.length > 0 ? (
        <div className="space-y-3">
          {activeInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              facilityId={facilityId}
              accountId={accountId}
              onIssueSuccess={onPaymentSuccess}
              onPaymentSuccess={onPaymentSuccess}
            />
          ))}
        </div>
      ) : (
        !hasUnbilledItems && (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <ReceiptIcon className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-600">
                  {t("no_invoices_yet")}
                </p>
                <p className="text-sm mt-1">
                  {t("no_invoices_yet_description")}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

// Main Component
interface Props {
  facilityId: string;
  patient: PatientListRead;
  locationId: string;
  status: MedicationDispenseStatus | undefined;
  dispenseOrder: DispenseOrderRead;
  medications: MedicationDispenseRead[];
  updateQuery: ({ status }: { status: MedicationDispenseStatus }) => void;
}

export default function DispensedMedicationList({
  facilityId,
  patient,
  locationId,
  status: _status,
  dispenseOrder,
  medications,
  updateQuery: _updateQuery,
}: Props) {
  useShortcutSubContext("facility:pharmacy");
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [billableChargeItems, setBillableChargeItems] = useState<
    ChargeItemRead[]
  >([]);
  const [createInvoiceSheetOpen, setCreateInvoiceSheetOpen] = useState(false);

  const { data: account } = useQuery({
    queryKey: ["accounts", patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patient.id,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
  });

  const { mutate: updateDispenseOrder, isPending: isUpdatingDispenseOrder } =
    useMutation({
      mutationFn: mutate(batchApi.batchRequest),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["dispenseOrder", facilityId, dispenseOrder.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["medication_dispense", dispenseOrder.id, locationId],
        });
        toast.success(t("medication_dispense_updated"));
      },
      onError: () => {
        toast.error(t("error_updating_medication_dispenses"));
      },
    });

  const handleUpdateDispenseOrder = (
    newDispenseOrderStatus: DispenseOrderStatus = DispenseOrderStatus.completed,
  ) => {
    const requests: Array<{
      url: string;
      method: string;
      reference_id: string;
      body: unknown;
    }> = [
      {
        url: `/api/v1/facility/${facilityId}/order/dispense/${dispenseOrder.id}/`,
        method: "PATCH",
        reference_id: `update_dispense_order_${dispenseOrder.id}`,
        body: { status: newDispenseOrderStatus },
      },
    ];
    const medicationsDispenses =
      medications.filter(
        (med) =>
          med.status === MedicationDispenseStatus.preparation ||
          med.status === MedicationDispenseStatus.in_progress,
      ) || [];

    if (medicationsDispenses.length > 0) {
      let newMedicationDispenseStatus = MedicationDispenseStatus.in_progress;
      switch (newDispenseOrderStatus) {
        case DispenseOrderStatus.draft:
          newMedicationDispenseStatus = MedicationDispenseStatus.preparation;
          break;
        case DispenseOrderStatus.abandoned:
          newMedicationDispenseStatus = MedicationDispenseStatus.cancelled;
          break;
        case DispenseOrderStatus.entered_in_error:
          newMedicationDispenseStatus =
            MedicationDispenseStatus.entered_in_error;
          break;
        case DispenseOrderStatus.completed:
          newMedicationDispenseStatus = MedicationDispenseStatus.completed;
          break;
        default:
          newMedicationDispenseStatus = MedicationDispenseStatus.in_progress;
          break;
      }
      const updates: MedicationDispenseUpsert[] = medicationsDispenses.map(
        (dispense) => ({
          id: dispense.id,
          status: newMedicationDispenseStatus,
          category: MedicationDispenseCategory.outpatient,
          when_prepared: dispense.when_prepared,
          dosage_instruction: dispense.dosage_instruction,
        }),
      );
      requests.push({
        url: `/api/v1/medication/dispense/upsert/`,
        method: "POST",
        reference_id: `update_medication_dispenses`,
        body: { datapoints: updates },
      });
    }

    updateDispenseOrder({ requests });
  };

  // Filter medications by status
  const filteredMedications = useMemo(() => {
    if (statusFilter === "all") return medications;
    return medications.filter((med) => med.status === statusFilter);
  }, [medications, statusFilter]);

  // Get billable items (including items from cancelled invoices, excluding cancelled/aborted charge items)
  const billableItems = useMemo(() => {
    return medications
      ?.filter((med) => {
        const chargeItem = med.charge_item;
        if (!chargeItem) return false;

        // Exclude charge items that are themselves cancelled/aborted/entered_in_error
        if (
          chargeItem.status === ChargeItemStatus.aborted ||
          chargeItem.status === ChargeItemStatus.entered_in_error ||
          chargeItem.status === ChargeItemStatus.not_billable
        ) {
          return false;
        }

        // Include items that are billable
        if (chargeItem.status === ChargeItemStatus.billable) {
          return true;
        }

        // Include items from cancelled invoices (their status might still be 'billed' but invoice is cancelled)
        if (
          chargeItem.paid_invoice?.status === InvoiceStatus.cancelled ||
          chargeItem.paid_invoice?.status === InvoiceStatus.entered_in_error
        ) {
          return true;
        }

        return false;
      })
      .map((med) => med.charge_item);
  }, [medications]);

  // Extract unique invoice IDs from all medications
  const invoiceIds = useMemo(() => {
    const ids = new Set<string>();
    medications?.forEach((med) => {
      const invoice = med.charge_item?.paid_invoice;
      if (invoice?.id) {
        ids.add(invoice.id);
      }
    });
    return Array.from(ids);
  }, [medications]);

  // Fetch full invoice details (includes payment information)
  const invoiceQueries = useQueries({
    queries: invoiceIds.map((invoiceId) => ({
      queryKey: ["invoice", facilityId, invoiceId],
      queryFn: query(invoiceApi.retrieveInvoice, {
        pathParams: { facilityId, invoiceId },
      }),
      enabled: !!invoiceId,
    })),
  });

  // Combine invoice data
  const relatedInvoices = useMemo(() => {
    return invoiceQueries
      .filter((q) => q.data)
      .map((q) => q.data as InvoiceRead);
  }, [invoiceQueries]);

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["medication_dispense", dispenseOrder.id, locationId],
    });
    queryClient.invalidateQueries({
      queryKey: ["accounts", patient.id],
    });
    // Invalidate all invoice queries to refresh payment data
    invoiceIds.forEach((invoiceId) => {
      queryClient.invalidateQueries({
        queryKey: ["invoice", facilityId, invoiceId],
      });
    });
  };

  // Get status counts for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: medications.length };
    medications.forEach((med) => {
      counts[med.status] = (counts[med.status] || 0) + 1;
    });
    return counts;
  }, [medications]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Panel - Medications */}
      <div className="lg:col-span-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("medications")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/facility/${facilityId}/locations/${locationId}/medication_requests/?patient_external_id=${patient.id}&patient_name=${encodeURIComponent(patient.name || "")}`}
                basePath="/"
              >
                <PillIcon className="size-4" />
                {t("prescriptions")}
              </Link>
            </Button>
            {billableItems && billableItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBillableChargeItems(billableItems);
                  setCreateInvoiceSheetOpen(true);
                }}
              >
                <ReceiptIcon className="size-4" />
                {t("bill_medication")}
                <ShortcutBadge actionId="billing-action" />
              </Button>
            )}
            {(dispenseOrder.status === DispenseOrderStatus.draft ||
              dispenseOrder.status === DispenseOrderStatus.in_progress) && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CareIcon icon="l-ellipsis-v" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.values(DispenseOrderStatus)
                      .filter((s) => s !== dispenseOrder.status)
                      .filter((s) => s !== DispenseOrderStatus.completed)
                      .map((s) => (
                        <DropdownMenuItem asChild key={s}>
                          <Button
                            variant="ghost"
                            onClick={() => handleUpdateDispenseOrder(s)}
                            className="w-full justify-start"
                            disabled={isUpdatingDispenseOrder}
                          >
                            {t(`mark_as_${s}`)}
                          </Button>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() =>
                    handleUpdateDispenseOrder(DispenseOrderStatus.completed)
                  }
                  disabled={isUpdatingDispenseOrder}
                >
                  {t("complete_dispense")}
                  <ShortcutBadge actionId="dispense-button" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full"
        >
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">
              {t("all")} ({statusCounts.all || 0})
            </TabsTrigger>
            <TabsTrigger value={MedicationDispenseStatus.preparation}>
              {t("preparation")} ({statusCounts.preparation || 0})
            </TabsTrigger>
            <TabsTrigger value={MedicationDispenseStatus.in_progress}>
              {t("in_progress")} ({statusCounts.in_progress || 0})
            </TabsTrigger>
            <TabsTrigger value={MedicationDispenseStatus.completed}>
              {t("completed")} ({statusCounts.completed || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Medications List */}
        {!filteredMedications?.length ? (
          <EmptyState
            title={t("no_medications_found")}
            description={t("no_medications_found_description")}
            icon={<CareIcon icon="l-tablets" className="text-primary size-6" />}
          />
        ) : (
          <MedicationTable medications={filteredMedications} />
        )}
      </div>

      {/* Right Panel - Billing Summary */}
      <div className="lg:col-span-2">
        <BillingSummaryPanel
          facilityId={facilityId}
          patientId={patient.id}
          medications={medications}
          relatedInvoices={relatedInvoices}
          accountId={account?.results?.[0]?.id}
          onPaymentSuccess={handlePaymentSuccess}
          unbilledItems={billableItems as ChargeItemRead[]}
          onCreateInvoice={(items) => {
            setBillableChargeItems(items);
            setCreateInvoiceSheetOpen(true);
          }}
        />
      </div>

      {/* Create Invoice Sheet */}
      {account && account.results.length > 0 && (
        <CreateInvoiceSheet
          facilityId={facilityId}
          accountId={account.results[0].id}
          open={createInvoiceSheetOpen}
          onOpenChange={setCreateInvoiceSheetOpen}
          preSelectedChargeItems={billableChargeItems}
          sourceUrl={`/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}`}
          skipNavigation={true}
          onSuccess={() => {
            setCreateInvoiceSheetOpen(false);
            setBillableChargeItems([]);
            // Refresh data after invoice creation
            handlePaymentSuccess();
          }}
        />
      )}
    </div>
  );
}
