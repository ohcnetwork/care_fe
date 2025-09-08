import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeCheck,
  BanknoteArrowDownIcon,
  Building2,
  CreditCard,
  FileCheck,
  FileText,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MonetaryDisplay,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import AddChargeItemSheet from "@/components/Billing/Invoice/AddChargeItemSheet";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useAppHistory from "@/hooks/useAppHistory";

import dayjs from "@/Utils/dayjs";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { EditInvoiceDialog } from "@/components/Billing/Invoice/EditInvoiceDialog";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemRead,
  MRP_CODE,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  INVOICE_STATUS_COLORS,
  InvoiceCreate,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import facilityApi from "@/types/facility/facilityApi";

const paymentMethodMap: Record<
  PaymentReconciliationPaymentMethod,
  { label: string; icon: React.ReactNode }
> = {
  cash: { label: "Cash", icon: <BanknoteArrowDownIcon className="size-5" /> },
  ccca: { label: "Credit Card", icon: <CreditCard className="size-5" /> },
  cchk: { label: "Credit Check", icon: <FileCheck className="size-5" /> },
  cdac: { label: "Credit Account", icon: <Wallet className="size-5" /> },
  chck: { label: "Check", icon: <FileText className="size-5" /> },
  ddpo: { label: "Direct Deposit", icon: <Building2 className="size-5" /> },
  debc: { label: "Debit Card", icon: <CreditCard className="size-5" /> },
};

export function InvoiceShow({
  facilityId,
  invoiceId,
}: {
  facilityId: string;
  invoiceId: string;
}) {
  const { t } = useTranslation();
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChargeItems, setSelectedChargeItems] = useState<
    ChargeItemRead[]
  >([]);
  const [chargeItemToRemove, setChargeItemToRemove] = useState<string | null>(
    null,
  );
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "payment_history" | "invoice_activity"
  >("payment_history");
  const queryClient = useQueryClient();

  const activeTabStyle =
    "border-b-2 border-primary font-medium text-primary-900";
  const inactiveTabStyle = "text-gray-500 hover:text-gray-700 font-medium";

  const tableHeadClass = "border-r border-gray-200 font-semibold text-center";
  const tableCellClass =
    "border-r border-gray-200 font-medium text-gray-950 text-sm";
  const { goBack } = useAppHistory();

  // Fetch facility data for available components
  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: query(paymentReconciliationApi.listPaymentReconciliation, {
      pathParams: { facilityId },
      queryParams: {
        target_invoice: invoiceId,
        limit: 100,
        reconciliation_type: PaymentReconciliationType.payment,
      },
    }),
  });

  const { mutate: removeChargeItem, isPending: isRemoving } = useMutation({
    mutationFn: mutate(chargeItemApi.removeChargeItemFromInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("charge_item_removed_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setChargeItemToRemove(null);
    },
    onError: () => {
      toast.error(t("failed_to_remove_charge_item"));
    },
  });

  const { mutate: cancelInvoice, isPending: isCancelPending } = useMutation({
    mutationFn: mutate(invoiceApi.cancelInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_cancelled_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: () => {
      toast.error(t("failed_to_cancel_invoice"));
    },
  });

  const { mutate: updateInvoice, isPending: isUpdatingInvoice } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: () => {
      toast.error(t("failed_to_update_invoice"));
    },
  });

  const handleRemoveChargeItem = () => {
    if (chargeItemToRemove) {
      removeChargeItem({ charge_item: chargeItemToRemove });
    }
  };

  const getUnitComponentsByType = (
    item: ChargeItemRead,
    type: MonetaryComponentType,
  ) => {
    return (
      item.unit_price_components?.filter(
        (c) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getApplicableTaxColumns = (invoice: InvoiceRead) => {
    // Get all unique tax codes from invoice charge items using a Set
    const invoiceTaxCodes = new Set<string>();
    invoice.charge_items.forEach((item) => {
      getUnitComponentsByType(item, MonetaryComponentType.tax).forEach(
        (taxComponent) => {
          if (taxComponent.code?.code) {
            invoiceTaxCodes.add(taxComponent.code.code);
          }
        },
      );
    });
    // Convert Set back to array for return value
    return Array.from(invoiceTaxCodes);
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const handleStatusChange = (status: InvoiceStatus) => {
    if (
      status === InvoiceStatus.cancelled ||
      status === InvoiceStatus.entered_in_error ||
      status === InvoiceStatus.balanced
    ) {
      setSelectedStatus(status);
      setReasonDialogOpen(true);
    } else {
      const data: InvoiceCreate = {
        status,
        payment_terms: invoice?.payment_terms,
        note: invoice?.note,
        account: invoice?.account.id || "",
        charge_items: invoice?.charge_items.map((item) => item.id) || [],
        issue_date:
          status === InvoiceStatus.issued
            ? dayjs().toISOString()
            : invoice?.issue_date,
      };

      updateInvoice(data);
    }
  };

  const handleDialogSubmit = () => {
    if (!selectedStatus) return;

    if (selectedStatus === InvoiceStatus.balanced) {
      updateInvoice({
        status: selectedStatus,
        payment_terms: invoice?.payment_terms,
        note: invoice?.note,
        account: invoice?.account.id || "",
        charge_items: invoice?.charge_items.map((item) => item.id) || [],
        issue_date: invoice?.issue_date,
      });
    } else {
      cancelInvoice({ reason: selectedStatus });
    }

    setReasonDialogOpen(false);
  };

  const canEdit =
    invoice?.status !== InvoiceStatus.entered_in_error &&
    invoice?.status !== InvoiceStatus.cancelled;

  const [{ sourceUrl }] = useQueryParams();

  const alertButtonText = sourceUrl?.includes("medication_dispense")
    ? t("medication_dispense_invoice_alert")
    : t("service_request_invoice_alert");

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("invoice_not_found")}</h2>
          <p className="mt-2 text-gray-600">{t("invoice_may_not_exist")}</p>
          <Button asChild className="mt-4">
            <Link href={`/facility/${facilityId}/billing/invoices`}>
              {t("back_to_invoices")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-gray-400 gap-1"
            onClick={() => goBack()}
          >
            <CareIcon icon="l-arrow-left" className="size-4" />
            <span className="text-gray-950 font-medium">{t("back")}</span>
          </Button>
        </div>
        <div className="flex gap-2">
          {invoice?.status === InvoiceStatus.draft && (
            <Button
              variant="outline_primary"
              className="w-full flex flex-row justify-stretch items-center"
              onClick={() => handleStatusChange(InvoiceStatus.issued)}
              disabled={isUpdatingInvoice}
            >
              <CareIcon icon="l-check" className="size-5" />
              {t("issue_invoice")}
            </Button>
          )}
          {invoice?.status === InvoiceStatus.issued && (
            <Button
              variant="outline_primary"
              className="w-full flex flex-row justify-stretch items-center"
              onClick={() => handleStatusChange(InvoiceStatus.balanced)}
              disabled={isUpdatingInvoice}
            >
              <CareIcon icon="l-wallet" className="mr-1" />
              {t("mark_as_balanced")}
            </Button>
          )}
          {invoice.status === InvoiceStatus.issued && (
            <Button onClick={() => setIsPaymentSheetOpen(true)}>
              <CareIcon icon="l-plus" className="mr-2 size-4" />
              {t("record_payment")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex flex-row justify-between items-center mb-4">
            <div className="flex flex-row items-center gap-2">
              <span className="font-semibold text-gray-950 text-base">
                {t("invoice")}: {invoice.number}
              </span>
              <Badge variant={INVOICE_STATUS_COLORS[invoice.status]}>
                {t(invoice.status)}
              </Badge>
            </div>
            <div className="flex flex-row gap-2">
              {invoice.status === InvoiceStatus.draft && (
                <Button
                  variant="outline"
                  className="border-gray-400 gap-1"
                  onClick={() => {
                    setIsEditDialogOpen(true);
                    setSelectedChargeItems(invoice.charge_items);
                  }}
                >
                  <CareIcon icon="l-edit" className="size-4" />
                  {t("edit_items")}
                </Button>
              )}
              <Button
                variant="outline"
                asChild
                className="border-gray-400 gap-1"
              >
                <Link
                  href={`/facility/${facilityId}/billing/invoice/${invoiceId}/print`}
                >
                  <CareIcon icon="l-print" className="size-4" />
                  {t("print")}
                </Link>
              </Button>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      data-cy="invoice-actions-button"
                      className="border-gray-400 px-2"
                    >
                      <CareIcon icon="l-ellipsis-v" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild className="text-primary-900">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleStatusChange(InvoiceStatus.cancelled)
                        }
                        disabled={isCancelPending}
                        className="w-full flex flex-row justify-stretch items-center"
                        data-cy="invoice-cancel-button"
                      >
                        <CareIcon icon="l-times-circle" className="mr-1" />
                        <span>{t("mark_as_cancelled")}</span>
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-primary-900">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleStatusChange(InvoiceStatus.entered_in_error)
                        }
                        disabled={isCancelPending}
                        className="w-full flex flex-row justify-stretch items-center"
                        data-cy="invoice-mark-error-button"
                      >
                        <CareIcon
                          icon="l-exclamation-circle"
                          className="mr-1"
                        />
                        <span>{t("mark_as_entered_in_error")}</span>
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <Card className="rounded-sm shadow-sm">
            <CardHeader className="p-4">
              <CardTitle>
                <div>
                  <div className="font-semibold text-gray-950 text-base uppercase">
                    {t("tax_invoice")}
                  </div>
                  <div className="text-gray-600 text-sm font-medium">
                    {invoice.number}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <div className="px-4 py-0 my-4 text-gray-200">
              <Separator />
            </div>

            <CardContent className="space-y-4 px-4 pt-0 pb-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    {t("bill_to")}:
                  </div>
                  <div>
                    <p className="font-semibold text-gray-950 text-base ml-2">
                      {invoice.account.patient.name}
                    </p>
                    <p className="font-medium text-gray-700 text-sm whitespace-pre-wrap ml-2">
                      {invoice.account.patient.address}
                    </p>
                    <p className="font-medium text-gray-700 text-sm ml-2">
                      {t("phone")}:{" "}
                      {formatPhoneNumberIntl(
                        invoice.account.patient.phone_number,
                      )}
                    </p>
                  </div>
                  <div className="mt-2">
                    {invoice.note && <p>{invoice.note}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-700 text-sm">
                    {t("issue_date")}:
                  </div>
                  <p className="font-medium text-gray-950 text-sm">
                    {invoice.issue_date
                      ? format(
                          new Date(invoice.issue_date),
                          "dd MMM, yyyy h:mm a",
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-t-sm border border-gray-300">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className={tableHeadClass}>#</TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("item")}
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("mrp")} ({getCurrencySymbol()})
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("unit_price")} ({getCurrencySymbol()})
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("qty")}
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("discount")}
                      </TableHead>
                      {getApplicableTaxColumns(invoice).map((taxCode) => (
                        <TableHead key={taxCode} className={tableHeadClass}>
                          {t(taxCode)}
                        </TableHead>
                      ))}
                      <TableHead
                        className={
                          invoice.status === InvoiceStatus.draft
                            ? tableHeadClass
                            : "font-semibold text-center"
                        }
                      >
                        {t("total")} ({getCurrencySymbol()})
                      </TableHead>
                      {invoice?.status === InvoiceStatus.draft && (
                        <TableHead className="font-semibold text-center">
                          {t("actions")}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.charge_items.length === 0 ? (
                      <TableRow className="border-b border-gray-200">
                        <TableCell
                          colSpan={
                            invoice?.status === InvoiceStatus.draft
                              ? 8 + getApplicableTaxColumns(invoice).length
                              : 7 + getApplicableTaxColumns(invoice).length
                          }
                          className="text-center text-gray-500"
                        >
                          {t("no_charge_items")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoice.charge_items.flatMap((item, index) => {
                        const baseComponent = getBaseComponent(item);
                        const baseAmount = baseComponent?.amount || "0";
                        const mrpAmount = item.unit_price_components.find(
                          (c) =>
                            c.monetary_component_type ===
                              MonetaryComponentType.informational &&
                            c.code?.code === MRP_CODE,
                        )?.amount;

                        const mainRow = (
                          <TableRow
                            key={item.id}
                            className="border-b border-gray-200 hover:bg-muted/50"
                          >
                            <TableCell
                              className={cn(tableCellClass, "text-center")}
                            >
                              {index + 1}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "font-medium")}
                            >
                              {item.title}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-right")}
                            >
                              <MonetaryDisplay
                                amount={mrpAmount}
                                hideCurrency
                              />
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-right")}
                            >
                              <MonetaryDisplay
                                amount={baseAmount}
                                hideCurrency
                              />
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-center")}
                            >
                              {item.quantity}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-right")}
                            >
                              <div className="flex flex-col items-end gap-0.5">
                                <MonetaryDisplay
                                  amount={String(
                                    item.total_price_components
                                      .filter(
                                        (c) =>
                                          c.monetary_component_type ===
                                          MonetaryComponentType.discount,
                                      )
                                      .reduce(
                                        (acc, curr) =>
                                          acc + Number(curr.amount || 0),
                                        0,
                                      ),
                                  )}
                                  hideCurrency
                                />
                                {item.unit_price_components
                                  .filter(
                                    (c) =>
                                      c.monetary_component_type ===
                                      MonetaryComponentType.discount,
                                  )
                                  .map((discountComponent, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-gray-500"
                                    >
                                      <MonetaryDisplay
                                        {...discountComponent}
                                        hideCurrency
                                      />
                                    </div>
                                  ))}
                              </div>
                            </TableCell>
                            {facilityData &&
                              getApplicableTaxColumns(invoice).map(
                                (taxCode) => (
                                  <TableCell
                                    key={taxCode}
                                    className={cn(tableCellClass, "text-right")}
                                  >
                                    {(() => {
                                      const totalAmount =
                                        item.total_price_components.find(
                                          (c) => c.code?.code === taxCode,
                                        )?.amount;
                                      const unitAmount =
                                        item.unit_price_components.find(
                                          (c) => c.code?.code === taxCode,
                                        );
                                      return (
                                        <div className="flex flex-col items-end gap-0.5">
                                          <MonetaryDisplay
                                            amount={totalAmount}
                                            hideCurrency
                                          />
                                          <div className="text-xs text-gray-500">
                                            {totalAmount && (
                                              <MonetaryDisplay
                                                {...unitAmount}
                                                hideCurrency
                                              />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                ),
                              )}
                            <TableCell
                              className={
                                invoice.status === InvoiceStatus.draft
                                  ? cn(tableCellClass, "text-right")
                                  : "text-right"
                              }
                            >
                              <MonetaryDisplay
                                amount={item.total_price}
                                hideCurrency
                              />
                            </TableCell>
                            {invoice.status === InvoiceStatus.draft && (
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      {t("actions")}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setIsEditDialogOpen(true);
                                        // Pass only this item to edit
                                        setSelectedChargeItems([item]);
                                      }}
                                    >
                                      <CareIcon
                                        icon="l-edit"
                                        className="mr-2 size-4"
                                      />
                                      <span>{t("edit")}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setChargeItemToRemove(item.id)
                                      }
                                      className="text-destructive"
                                    >
                                      <CareIcon
                                        icon="l-trash"
                                        className="mr-2 size-4"
                                      />
                                      <span>{t("remove")}</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        );

                        return [mainRow];
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="border-x border-b border-gray-300 rounded-b-md p-2 -mt-4 border-t-none space-y-2">
                {invoice.status === InvoiceStatus.draft && (
                  <AddChargeItemSheet
                    facilityId={facilityId}
                    invoiceId={invoiceId}
                    accountId={invoice.account.id}
                    trigger={
                      <Button
                        variant="ghost"
                        className="w-full border border-gray-400 text-gray-950 font-semibold text-sm shadow-sm"
                      >
                        <CareIcon icon="l-plus" className="mr-2 size-4" />
                        {t("add_charge_item")}
                      </Button>
                    }
                  />
                )}

                <div className="flex flex-col items-end space-y-2 text-gray-950 font-mormal text-sm mb-4">
                  {/* Base Amount */}
                  {invoice.total_price_components
                    ?.filter(
                      (c) =>
                        c.monetary_component_type ===
                        MonetaryComponentType.base,
                    )
                    .map((component, index) => (
                      <div
                        key={`base-${index}`}
                        className="flex w-64 justify-between"
                      >
                        <span className="">
                          {component.code?.display || t("base_amount")}:
                        </span>
                        <span className="font-semibold">
                          <MonetaryDisplay amount={component.amount} />
                        </span>
                      </div>
                    ))}

                  {/* Surcharges */}
                  {invoice.total_price_components
                    ?.filter(
                      (c) =>
                        c.monetary_component_type ===
                        MonetaryComponentType.surcharge,
                    )
                    .map((component, index) => (
                      <div
                        key={`discount-${index}`}
                        className="flex w-64 justify-between text-gray-500 text-sm"
                      >
                        <span>
                          {component.code && `${component.code.display} `}(
                          {t("surcharge")})
                        </span>
                        <span>
                          + <MonetaryDisplay {...component} />
                        </span>
                      </div>
                    ))}

                  {/* Discounts */}
                  {invoice.total_price_components
                    ?.filter(
                      (c) =>
                        c.monetary_component_type ===
                        MonetaryComponentType.discount,
                    )
                    .map((component, index) => (
                      <div
                        key={`discount-${index}`}
                        className="flex w-64 justify-between text-gray-500 text-sm"
                      >
                        <span>
                          {component.code && `${component.code.display} `}(
                          {t("discount")})
                        </span>
                        <span>
                          - <MonetaryDisplay {...component} />
                        </span>
                      </div>
                    ))}

                  {/* Taxes */}
                  {invoice.total_price_components
                    ?.filter(
                      (c) =>
                        c.monetary_component_type === MonetaryComponentType.tax,
                    )
                    .map((component, index) => (
                      <div
                        key={`tax-${index}`}
                        className="flex w-64 justify-between text-gray-500 text-sm"
                      >
                        <span>
                          {component.code && `${component.code.display} `}(
                          {t("tax")})
                        </span>
                        <span>
                          + <MonetaryDisplay {...component} />
                        </span>
                      </div>
                    ))}

                  {/* Subtotal */}
                  <div className="flex w-64 justify-between">
                    <span className="text-gray-500">{t("net_amount")}</span>
                    <MonetaryDisplay amount={String(invoice.total_net)} />
                  </div>

                  <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                  {/* Total */}
                  <div className="flex w-64 justify-between font-bold">
                    <span>{t("total")}</span>
                    <MonetaryDisplay amount={String(invoice.total_gross)} />
                  </div>
                  <div className="p-1 border-b-2 border-dashed border-gray-200 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div>
            {invoice.payment_terms && (
              <Card className="mt-8 rounded-sm shadow-sm">
                <CardHeader className="font-semibold text-gray-950">
                  {t("payment_terms")}
                </CardHeader>
                <CardContent>
                  <p className="prose w-full text-sm">
                    {invoice.payment_terms}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-6">
            <div
              className={cn(
                "pb-2 cursor-pointer",
                activeTab === "payment_history"
                  ? activeTabStyle
                  : inactiveTabStyle,
              )}
              onClick={() => setActiveTab("payment_history")}
            >
              {t("payment_history")}
            </div>
            <div
              className={cn(
                "pb-2 cursor-pointer",
                activeTab === "invoice_activity"
                  ? activeTabStyle
                  : inactiveTabStyle,
              )}
              onClick={() => setActiveTab("invoice_activity")}
            >
              {t("invoice_activity")}
            </div>
          </div>
          {activeTab === "payment_history" ? (
            <div>
              {!payments?.results?.length || isPaymentsLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  {t("no_payments_recorded")}
                </div>
              ) : (
                payments.results.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="relative flex items-start py-8 px-3  group"
                  >
                    <div className="absolute left-[38px] top-0 bottom-0 flex flex-col items-center">
                      {index < payments.results.length - 1 && (
                        <div className="absolute w-0.5 bg-gray-200 h-full top-12" />
                      )}
                      <div className="size-12 rounded-full flex items-center justify-center border-2 border-gray-300 shadow-sm z-10 bg-white text-gray-500">
                        {paymentMethodMap[payment.method]?.icon}
                      </div>
                    </div>
                    <div className="flex pl-22 w-full">
                      <div className="flex justify-between items-start w-full -mt-6">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {getCurrencySymbol()}{" "}
                            <MonetaryDisplay
                              amount={String(payment.amount || "0")}
                              hideCurrency
                            />{" "}
                            {t("paid_via")}{" "}
                            {t(
                              paymentMethodMap[payment.method]?.label ||
                                payment.method,
                            )}
                          </p>
                          <p className="font-medium text-gray-700 text-sm">
                            {t("on")}{" "}
                            {payment.payment_datetime
                              ? format(
                                  new Date(payment.payment_datetime),
                                  "dd MMM, yyyy h:mm a",
                                )
                              : "-"}
                          </p>
                          {payment.reference_number && (
                            <p className="font-medium text-gray-700 text-sm">
                              Ref: {payment.reference_number}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]
                          }
                        >
                          {t(payment.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              {(() => {
                const events = [];

                events.push({
                  icon: <FileText className="size-5" />,
                  title: t("invoice_created"),
                });

                if (invoice.issue_date) {
                  events.push({
                    icon: <FileCheck className="size-5" />,
                    title: t("invoice_issued"),
                  });
                }

                if (invoice.status === InvoiceStatus.balanced) {
                  events.push({
                    icon: <Wallet className="size-5" />,
                    title: t("invoice_balanced"),
                  });
                }

                if (
                  invoice.status === InvoiceStatus.cancelled ||
                  invoice.status === InvoiceStatus.entered_in_error
                ) {
                  events.push({
                    icon: <CareIcon icon="l-times-circle" className="size-5" />,
                    title:
                      invoice.status === InvoiceStatus.cancelled
                        ? t("invoice_cancelled")
                        : t("invoice_entered_in_error"),
                  });
                }

                return events.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    {t("no_activity_recorded")}
                  </div>
                ) : (
                  events.map((event, index) => (
                    <div
                      key={index}
                      className="relative flex items-start py-10 px-3 group"
                    >
                      <div className="absolute left-[38px] top-0 bottom-0 flex flex-col items-center">
                        {index < events.length - 1 && (
                          <div className="absolute w-0.5 bg-gray-200 h-full top-12" />
                        )}
                        <div className="size-12 rounded-full flex items-center justify-center border-2 border-gray-300 shadow-sm z-10 bg-white text-gray-500">
                          {event.icon}
                        </div>
                      </div>
                      <div className="flex pl-22 w-full">
                        <div className="flex justify-between items-start w-full -mt-6">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {event.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <PaymentReconciliationSheet
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        facilityId={facilityId}
        invoice={invoice}
        accountId={invoice.account.id}
      />

      <AlertDialog
        open={!!chargeItemToRemove}
        onOpenChange={(open) => !open && setChargeItemToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_charge_item")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_charge_item_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={handleRemoveChargeItem}
              disabled={isRemoving}
            >
              {isRemoving ? t("removing_with_dots") : t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reasonDialogOpen}
        onOpenChange={(open) => {
          setReasonDialogOpen(open);
          if (!open) {
            setTimeout(() => setSelectedStatus(null), 150);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus === InvoiceStatus.balanced
                ? t("are_you_sure_want_to_mark_as_balanced")
                : selectedStatus === InvoiceStatus.entered_in_error
                  ? t("are_you_sure_want_to_mark_as_error")
                  : t("are_you_sure_want_to_cancel_invoice")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDialogSubmit}
              className={cn(
                buttonVariants({
                  variant:
                    selectedStatus === InvoiceStatus.balanced
                      ? "primary"
                      : "destructive",
                }),
              )}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditInvoiceDialog
        open={isEditDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedChargeItems([]);
          }
        }}
        facilityId={facilityId}
        chargeItems={selectedChargeItems}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
        }}
      />

      {sourceUrl && (
        <Alert className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-auto shadow-lg rounded-lg p-0 bg-white border border-gray-200">
          <AlertTitle className="flex items-center justify-between gap-0">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-l-lg p-4 flex-1">
              <BadgeCheck className="size-5 text-green-600" />
              <span className="font-semibold text-green-900">
                {t("invoice_alert_title")}
              </span>
            </div>
            <div className="flex items-center bg-white rounded-r-lg p-2 pl-0">
              <Button
                variant="primary"
                onClick={() => navigate(sourceUrl)}
                className="shadow ml-2"
              >
                {alertButtonText}
              </Button>
            </div>
          </AlertTitle>
        </Alert>
      )}
    </div>
  );
}

export default InvoiceShow;
