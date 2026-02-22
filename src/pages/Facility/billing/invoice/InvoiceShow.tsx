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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MonetaryDisplay,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import {
  INVOICE_STATUS_COLORS,
  InvoiceCreate,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import { PaymentReconciliationStatus } from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  EyeIcon,
  FileCheck,
  PrinterIcon,
  ReceiptText,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";
import AddChargeItemSheet from "@/components/Billing/Invoice/AddChargeItemSheet";
import { EditInvoiceDialog } from "@/components/Billing/Invoice/EditInvoiceDialog";
import BackButton from "@/components/Common/BackButton";
import { DisablingCover } from "@/components/Common/DisablingCover";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { formatPatientAddress } from "@/components/Patient/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { useCareApps } from "@/hooks/useCareApps";
import { cn } from "@/lib/utils";
import {
  InvoiceChargeItemTitle,
  useMedicationDispenseData,
} from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import { PLUGIN_Component } from "@/PluginEngine";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ACCOUNT_STATUS_COLORS } from "@/types/billing/account/Account";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { PAYMENT_RECONCILIATION_METHOD_MAP } from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { getPartialId } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import facilityApi from "@/types/facility/facilityApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import dayjs from "@/Utils/dayjs";
import { add, multiply, round, subtract } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

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
  const [activePaymentsDialogOpen, setActivePaymentsDialogOpen] =
    useState(false);
  const [isAddChargeItemSheetOpen, setIsAddChargeItemSheetOpen] =
    useState(false);
  const queryClient = useQueryClient();
  useShortcutSubContext("facility:billing:invoice:show");

  const tableHeadClass = "border-r border-gray-200 font-semibold text-center";
  const tableCellClass =
    "border-r border-gray-200 font-medium text-gray-950 text-sm";

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

  const patient = invoice?.account.patient;

  // Fetch patient data for identifiers
  const { data: verifiedPatient } = useQuery({
    queryKey: ["patient-verify", patient?.id, patient?.year_of_birth],
    queryFn: query(patientApi.searchRetrieve, {
      pathParams: { facilityId },
      body: {
        phone_number: patient?.phone_number ?? "",
        year_of_birth: patient?.year_of_birth?.toString() ?? "",
        partial_id: patient ? getPartialId(patient) : "",
      },
    }),
    enabled: !!patient,
  });

  // Pre-fetch medication dispense data for charge items
  const { dispenseMap, isLoadingDispenses } = useMedicationDispenseData(
    invoice?.charge_items,
  );

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

  const { mutate: lockInvoice, isPending: isLockPending } = useMutation({
    mutationFn: mutate(invoiceApi.lockInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_locked_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: () => {
      toast.error(t("failed_to_lock_invoice"));
    },
  });

  const { mutate: unlockInvoice, isPending: isUnlockPending } = useMutation({
    mutationFn: mutate(invoiceApi.unlockInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_unlocked_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: () => {
      toast.error(t("failed_to_unlock_invoice"));
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
      // Check for active payments or credit notes when trying to cancel or mark as entered in error
      if (
        status === InvoiceStatus.cancelled ||
        status === InvoiceStatus.entered_in_error
      ) {
        const hasActivePayments = !!invoice?.payments?.some(
          (p) => p.status === PaymentReconciliationStatus.active,
        );
        const hasActiveCreditNotes = !!invoice?.credit_notes?.some(
          (p) => p.status === PaymentReconciliationStatus.active,
        );

        if (hasActivePayments || hasActiveCreditNotes) {
          setSelectedStatus(status);
          setActivePaymentsDialogOpen(true);
          return;
        }
      }

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

      updateInvoice(data, {
        onSuccess: () => {
          if (status === InvoiceStatus.issued) {
            setIsPaymentSheetOpen(true);
          }
        },
      });
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

  const [{ sourceUrl, relatedInvoices }] = useQueryParams();

  const alertButtonText = (() => {
    if (sourceUrl?.includes("medication_return")) {
      return t("back_to_medication_return");
    }
    if (sourceUrl?.includes("medication_dispense")) {
      return t("medication_dispense_invoice_alert");
    }
    if (sourceUrl?.includes("service_requests")) {
      return t("service_request_invoice_alert");
    }
    if (sourceUrl?.includes("encounter")) {
      return t("back_to_encounter");
    }
    return t("appointment_invoice_alert");
  })();

  const careApps = useCareApps();
  const isInvoiceRecordPaymentPluginsPresent = careApps.some(
    (plugin) =>
      !plugin.isLoading && plugin.components?.InvoiceRecordPaymentOptions,
  );

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
            <Link
              href={`/facility/${facilityId}/billing/invoices`}
              data-shortcut-id="go-back"
            >
              {t("back_to_invoices")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DisablingCover
      disabled={isLoadingDispenses}
      message={t("loading_medication_details")}
    >
      <div className="space-y-8 relative">
        <div className="flex items-start justify-between flex-col sm:flex-row gap-4 sm:items-center border-b-3 border-double pb-4">
          <div className="flex gap-3 sm:gap-6 flex-col md:flex-row">
            <BackButton
              variant="link"
              className="px-0 justify-start"
              to={`/facility/${facilityId}/billing/account/${invoice.account.id}`}
            >
              <ChevronLeft />
              <span>{t("back")}</span>
            </BackButton>
            <div className="h-auto w-px bg-gray-300" aria-hidden="true" />
            <div>
              <label className="text-gray-700 text-sm font-medium">
                {t("patient_name")}
              </label>
              <Link
                href={`/facility/${facilityId}/patients/verify?${new URLSearchParams(
                  {
                    phone_number: invoice.account.patient.phone_number,
                    year_of_birth:
                      invoice.account.patient.year_of_birth?.toString() || "",
                    partial_id: invoice.account.patient.id.slice(0, 5),
                  },
                ).toString()}`}
              >
                <div className="font-semibold text-gray-950 underline">
                  {invoice.account.patient.name}
                  <SquareArrowOutUpRight className="ml-1 size-4 inline" />
                </div>
              </Link>
            </div>

            <div>
              <label className="text-gray-700 text-sm font-medium">
                {t("account")}
              </label>
              <Link
                href={`/facility/${facilityId}/billing/account/${invoice.account.id}`}
              >
                <div className="font-semibold text-gray-950 underline">
                  {invoice.account.name}
                  <SquareArrowOutUpRight className="ml-1 size-4 inline" />
                </div>
              </Link>
            </div>
            <div className="flex flex-row gap-6">
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  {t("amount_due")}
                </label>
                <div className="font-semibold text-gray-950">
                  <MonetaryDisplay amount={invoice.account.total_balance} />
                </div>
              </div>
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  {t("status")}
                </label>
                <div className="font-semibold text-gray-950">
                  <Badge
                    variant={ACCOUNT_STATUS_COLORS[invoice.account.status]}
                  >
                    {t(invoice.account.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
            {invoice?.status === InvoiceStatus.draft && (
              <Button
                variant="outline_primary"
                onClick={() => handleStatusChange(InvoiceStatus.issued)}
                disabled={isUpdatingInvoice}
              >
                <CareIcon icon="l-check" className="size-5" />
                {t("issue_invoice")}
                <ShortcutBadge actionId="issue-invoice" />
              </Button>
            )}
            {invoice?.status === InvoiceStatus.issued && (
              <Button
                variant="outline_primary"
                onClick={() => handleStatusChange(InvoiceStatus.balanced)}
                disabled={isUpdatingInvoice}
              >
                <CareIcon icon="l-wallet" className="mr-1" />
                {t("mark_as_balanced")}
                <ShortcutBadge actionId="mark-as-balanced" />
              </Button>
            )}
            {invoice.status === InvoiceStatus.issued && (
              <ButtonGroup className="w-full">
                <Button
                  className="w-full"
                  onClick={() => setIsPaymentSheetOpen(true)}
                >
                  <CareIcon icon="l-plus" className="mr-2 size-4" />
                  {invoice.is_refund
                    ? t("record_credit_note")
                    : t("record_payment")}
                  <ShortcutBadge actionId="record-payment" />
                </Button>
                {isInvoiceRecordPaymentPluginsPresent && !invoice.is_refund && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline_primary"
                        size="icon"
                        aria-label="More Options"
                      >
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-min">
                      <DropdownMenuGroup>
                        <PLUGIN_Component
                          __name="InvoiceRecordPaymentOptions"
                          facilityId={facilityId}
                          invoice={invoice}
                        />
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </ButtonGroup>
            )}
          </div>
        </div>

        <div className="md:col-span-2 overflow-x-auto max-w-5xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {t("invoice_summary")}
                </span>
                <Badge variant={INVOICE_STATUS_COLORS[invoice.status]}>
                  {t(invoice.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    {t("total_amount")}
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    <MonetaryDisplay amount={invoice.total_gross} />
                  </div>
                </div>
                <div className="h-6 w-px bg-gray-300" />
                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    {invoice.is_refund
                      ? t("total_credit_notes")
                      : t("total_payments_received")}
                  </div>
                  <div
                    className={cn(
                      "text-base font-semibold",
                      invoice.is_refund ? "text-red-600" : "text-green-600",
                    )}
                  >
                    <MonetaryDisplay
                      amount={
                        invoice.is_refund
                          ? -invoice.total_credit_notes
                          : invoice.total_payments
                      }
                    />
                  </div>
                </div>
                <div className="h-6 w-px bg-gray-300" />
                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    {t("balance_due")}
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    <MonetaryDisplay
                      amount={subtract(
                        subtract(invoice.total_gross, invoice.total_payments),
                        multiply(
                          invoice.total_credit_notes,
                          invoice.is_refund ? -1 : 1,
                        ),
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {invoice.status === InvoiceStatus.balanced &&
            parseFloat(
              subtract(
                subtract(invoice.total_gross, invoice.total_payments),
                multiply(
                  invoice.total_credit_notes,
                  invoice.is_refund ? -1 : 1,
                ),
              ).toString(),
            ) > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-3 flex gap-2 items-center">
                <CareIcon
                  icon="l-info-circle"
                  className="text-blue-600 size-4 shrink-0"
                />
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">
                    <MonetaryDisplay
                      amount={subtract(
                        subtract(invoice.total_gross, invoice.total_payments),
                        multiply(
                          invoice.total_credit_notes,
                          invoice.is_refund ? -1 : 1,
                        ),
                      )}
                    />
                  </span>{" "}
                  {t("unpaid_moved_to_account")}
                </p>
              </div>
            )}

          <div className="flex sm:flex-row flex-col sm:items-center gap-4 justify-between items-start mb-4">
            <div className="flex flex-row items-center gap-2">
              <span className="font-semibold text-gray-950 text-base">
                {t("invoice")}: {invoice.number}
              </span>
              <Badge variant={INVOICE_STATUS_COLORS[invoice.status]}>
                {t(invoice.status)}
              </Badge>
              {invoice.locked && (
                <Badge variant="secondary" className="gap-1">
                  <CareIcon icon="l-lock" className="size-3" />
                  {t("locked")}
                </Badge>
              )}
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
                  <ShortcutBadge actionId="edit-button" />
                </Button>
              )}
              <Button
                variant="outline"
                className="border-gray-400 gap-1"
                onClick={() => {
                  if (relatedInvoices) {
                    // Navigate to multi-invoice print with all invoices
                    const allInvoiceIds = [
                      ...relatedInvoices.split(","),
                      invoiceId,
                    ].join(",");
                    navigate(
                      `/facility/${facilityId}/billing/invoices/${allInvoiceIds}/print`,
                    );
                  } else {
                    // Navigate to single invoice print
                    navigate(
                      `/facility/${facilityId}/billing/invoice/${invoiceId}/print`,
                    );
                  }
                }}
              >
                <CareIcon icon="l-print" className="size-4" />
                {t("print")}
                <ShortcutBadge actionId="print-invoice" />
              </Button>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-400 px-2">
                      <CareIcon icon="l-ellipsis-v" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {invoice.locked ? (
                      <DropdownMenuItem asChild className="text-primary-900">
                        <Button
                          variant="ghost"
                          onClick={() => unlockInvoice({})}
                          disabled={isUnlockPending}
                          className="w-full flex flex-row justify-stretch items-center"
                        >
                          <CareIcon icon="l-unlock" className="mr-1" />
                          <span>{t("unlock_invoice")}</span>
                        </Button>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild className="text-primary-900">
                        <Button
                          variant="ghost"
                          onClick={() => lockInvoice({})}
                          disabled={isLockPending}
                          className="w-full flex flex-row justify-stretch items-center"
                        >
                          <CareIcon icon="l-lock" className="mr-1" />
                          <span>{t("lock_invoice")}</span>
                        </Button>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="text-primary-900">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleStatusChange(InvoiceStatus.cancelled)
                        }
                        disabled={isCancelPending}
                        className="w-full flex flex-row justify-stretch items-center"
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
                    <div className="flex gap-1 font-medium text-gray-700 text-sm ml-2">
                      {t("address")}:{" "}
                      <p className="font-medium text-gray-700 text-sm whitespace-pre-wrap ml-2">
                        {formatPatientAddress(
                          invoice.account.patient.address,
                        ) || (
                          <span className="text-gray-500">
                            {t("no_address_provided")}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="font-medium text-gray-700 text-sm ml-2">
                      {t("phone")}:{" "}
                      {formatPhoneNumberIntl(
                        invoice.account.patient.phone_number,
                      )}
                    </p>
                    {verifiedPatient &&
                      "instance_identifiers" in verifiedPatient &&
                      verifiedPatient.instance_identifiers
                        .filter(
                          ({ config }) =>
                            config.config.use ===
                              PatientIdentifierUse.official &&
                            !config.config.auto_maintained,
                        )
                        .map((identifier) => (
                          <p
                            key={identifier.config.id}
                            className="font-medium text-gray-700 text-sm ml-2"
                          >
                            <span>{identifier.config.config.display}: </span>
                            <span>{identifier.value}</span>
                          </p>
                        ))}
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
                      <TableHead className={cn(tableHeadClass, "text-left")}>
                        {t("item")}
                      </TableHead>
                      <TableHead className={cn(tableHeadClass, "text-left")}>
                        {t("performer")}
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
                              ? 9 + getApplicableTaxColumns(invoice).length
                              : 8 + getApplicableTaxColumns(invoice).length
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
                              className={cn(
                                tableCellClass,
                                "font-semibold min-w-40",
                              )}
                            >
                              <InvoiceChargeItemTitle
                                item={item}
                                dispenseMap={dispenseMap}
                                isLoading={isLoadingDispenses}
                              />
                            </TableCell>
                            <TableCell
                              className={cn(
                                tableCellClass,
                                "max-w-32 whitespace-pre-wrap",
                              )}
                            >
                              {formatName(item.performer_actor)}
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
                              {round(item.quantity)}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-right")}
                            >
                              <div className="flex flex-col items-end gap-0.5">
                                <MonetaryDisplay
                                  amount={add(
                                    ...item.total_price_components
                                      .filter(
                                        (c) =>
                                          c.monetary_component_type ===
                                          MonetaryComponentType.discount,
                                      )
                                      .map((c) => c.amount || "0"),
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
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setIsEditDialogOpen(true);
                                      // Pass only this item to edit
                                      setSelectedChargeItems([item]);
                                    }}
                                    title={t("edit")}
                                  >
                                    <CareIcon
                                      icon="l-edit"
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setChargeItemToRemove(item.id)
                                    }
                                    title={t("remove")}
                                  >
                                    <CareIcon
                                      icon="l-trash"
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </div>
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

              <div
                className={cn(
                  "border-x border-gray-300 p-2 -mt-4 border-t-none space-y-2",
                  invoice.payments?.filter(
                    (p) => p.status === PaymentReconciliationStatus.active,
                  ).length === 0 && "border-b rounded-b-md",
                )}
              >
                {invoice.status === InvoiceStatus.draft && (
                  <AddChargeItemSheet
                    facilityId={facilityId}
                    invoiceId={invoiceId}
                    accountId={invoice.account.id}
                    open={isAddChargeItemSheetOpen}
                    setOpen={setIsAddChargeItemSheetOpen}
                    trigger={
                      <Button
                        variant="ghost"
                        className="w-full border border-gray-400 text-gray-950 font-semibold text-sm shadow-sm"
                        disabled={isAddChargeItemSheetOpen}
                      >
                        <CareIcon icon="l-plus" className="mr-2 size-4" />
                        {t("add_charge_item")}
                        <ShortcutBadge actionId="add-charge-item" />
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

                  {/* Subtotal */}
                  <div className="flex w-64 justify-between">
                    <span className="text-gray-500">{t("net_amount")}</span>
                    <MonetaryDisplay amount={invoice.total_net} />
                  </div>

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

                  <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                  {/* Total */}
                  <div className="flex w-64 justify-between font-bold">
                    <span>{t("total")}</span>
                    <MonetaryDisplay amount={invoice.total_gross} />
                  </div>
                  <div className="p-1 pb-2.5 border-t-2 border-dashed border-gray-200 w-full" />
                </div>
              </div>

              {invoice.payments?.filter(
                (p) => p.status === PaymentReconciliationStatus.active,
              ).length > 0 && (
                <>
                  <div className="border-x border-b border-t border-gray-300 rounded-b-md -mt-4 space-y-2">
                    <div className="-mt-7 px-3 font-medium ">
                      {invoice.is_refund
                        ? t("refunds_given_against_this_invoice")
                        : t("payments_received_against_this_invoice")}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className={tableHeadClass}>#</TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("date_and_time")}
                          </TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("payment_method")}
                          </TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("reference")}
                          </TableHead>
                          <TableHead
                            className={
                              invoice.status === InvoiceStatus.draft
                                ? tableHeadClass
                                : "font-semibold text-right"
                            }
                          >
                            {t("amount")} ({getCurrencySymbol()})
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.payments
                          .filter(
                            (p) =>
                              p.status === PaymentReconciliationStatus.active,
                          )
                          .map((payment, index) => {
                            const mainRow = (
                              <TableRow
                                key={payment.id}
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
                                  <span className="flex justify-between items-center flex-wrap gap-2">
                                    {payment.payment_datetime
                                      ? format(
                                          new Date(payment.payment_datetime),
                                          "d MMM yyyy, hh:mm a",
                                        )
                                      : "-"}

                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-gray-800 font-semibold text-xs p-2"
                                        onClick={() => {
                                          navigate(
                                            `/facility/${facilityId}/billing/payments/${payment.id}`,
                                          );
                                        }}
                                      >
                                        <>
                                          <EyeIcon className="size-3" />
                                          {t("view")}
                                        </>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-gray-800 font-semibold text-xs p-2"
                                        onClick={() => {
                                          navigate(
                                            `/facility/${facilityId}/billing/payments/${payment.id}/print`,
                                          );
                                        }}
                                      >
                                        <>
                                          <PrinterIcon className="size-3" />
                                          {t("print")}
                                        </>
                                      </Button>
                                    </div>
                                  </span>
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClass, "text-left")}
                                >
                                  {
                                    PAYMENT_RECONCILIATION_METHOD_MAP[
                                      payment.method
                                    ]
                                  }
                                </TableCell>
                                <TableCell className={tableCellClass}>
                                  {payment.reference_number}
                                </TableCell>
                                <TableCell className="text-right">
                                  <MonetaryDisplay
                                    amount={multiply(
                                      payment.amount,
                                      payment.is_credit_note ? -1 : 1,
                                    )}
                                    hideCurrency
                                  />
                                </TableCell>
                              </TableRow>
                            );

                            return [mainRow];
                          })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-col items-end space-y-2 text-gray-950 font-mormal text-sm mb-4">
                    <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                    {/* Total Received/Refunded */}
                    <div className="flex w-64 justify-between font-bold">
                      <span>
                        {invoice.is_refund
                          ? t("total_refunded")
                          : t("total_received")}
                      </span>
                      <MonetaryDisplay amount={invoice.total_payments} />
                    </div>
                    <div className="p-1 border-b-2 border-dashed border-gray-200 w-full" />
                  </div>
                </>
              )}

              {invoice.credit_notes?.filter(
                (p) => p.status === PaymentReconciliationStatus.active,
              ).length > 0 && (
                <>
                  <div className="border border-gray-300 rounded-md space-y-2">
                    <div className="mt-2 px-3 font-medium">
                      {t("credit_notes_issued_against_this_invoice")}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className={tableHeadClass}>#</TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("date_and_time")}
                          </TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("payment_method")}
                          </TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("reference")}
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            {t("amount")} ({getCurrencySymbol()})
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.credit_notes
                          .filter(
                            (p) =>
                              p.status === PaymentReconciliationStatus.active,
                          )
                          .map((creditNote, index) => (
                            <TableRow
                              key={creditNote.id}
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
                                <span className="flex justify-between items-center flex-wrap gap-2">
                                  {creditNote.payment_datetime
                                    ? format(
                                        new Date(creditNote.payment_datetime),
                                        "d MMM yyyy, hh:mm a",
                                      )
                                    : "-"}

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-gray-800 font-semibold text-xs p-2"
                                      onClick={() => {
                                        navigate(
                                          `/facility/${facilityId}/billing/payments/${creditNote.id}`,
                                        );
                                      }}
                                    >
                                      <>
                                        <EyeIcon className="size-3" />
                                        {t("view")}
                                      </>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-gray-800 font-semibold text-xs p-2"
                                      onClick={() => {
                                        navigate(
                                          `/facility/${facilityId}/billing/payments/${creditNote.id}/print`,
                                        );
                                      }}
                                    >
                                      <>
                                        <PrinterIcon className="size-3" />
                                        {t("print")}
                                      </>
                                    </Button>
                                  </div>
                                </span>
                              </TableCell>
                              <TableCell
                                className={cn(tableCellClass, "text-left")}
                              >
                                {
                                  PAYMENT_RECONCILIATION_METHOD_MAP[
                                    creditNote.method
                                  ]
                                }
                              </TableCell>
                              <TableCell className={tableCellClass}>
                                {creditNote.reference_number}
                              </TableCell>
                              <TableCell className="text-right">
                                <MonetaryDisplay
                                  amount={creditNote.amount}
                                  hideCurrency
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-col items-end space-y-2 text-gray-950 font-mormal text-sm mb-4">
                    <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                    {/* Total Credit Notes */}
                    <div className="flex w-64 justify-between font-bold">
                      <span>{t("total_credit_notes")}</span>
                      <MonetaryDisplay amount={invoice.total_credit_notes} />
                    </div>
                    <div className="p-1 border-b-2 border-dashed border-gray-200 w-full" />
                  </div>
                </>
              )}
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

        <PaymentReconciliationSheet
          open={isPaymentSheetOpen}
          onOpenChange={setIsPaymentSheetOpen}
          facilityId={facilityId}
          invoice={invoice}
          accountId={invoice.account.id}
          isCreditNote={invoice.is_refund}
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
              <AlertDialogCancel>
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: "destructive" }))}
                onClick={handleRemoveChargeItem}
                disabled={isRemoving}
              >
                {isRemoving ? t("removing_with_dots") : t("remove")}
                <ShortcutBadge actionId="submit-action" />
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
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  {selectedStatus === InvoiceStatus.balanced ? (
                    <>
                      <p>{t("are_you_sure_want_to_mark_as_balanced")}</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {t("invoice_total")}
                          </span>
                          <span className="font-medium text-gray-900">
                            <MonetaryDisplay amount={invoice.total_gross} />
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {t("total_payments_received")}
                          </span>
                          <span className="font-medium text-green-600">
                            <MonetaryDisplay amount={invoice.total_payments} />
                          </span>
                        </div>
                        {parseFloat(invoice.total_credit_notes || "0") > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("total_credit_notes")}
                            </span>
                            <span className="font-medium text-red-600">
                              <MonetaryDisplay
                                amount={-invoice.total_credit_notes}
                              />
                            </span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                          <span className="text-gray-600">
                            {t("outstanding_balance")}
                          </span>
                          <span className="font-semibold text-gray-900">
                            <MonetaryDisplay
                              amount={subtract(
                                subtract(
                                  invoice.total_gross,
                                  invoice.total_payments,
                                ),
                                multiply(
                                  invoice.total_credit_notes || "0",
                                  invoice.is_refund ? -1 : 1,
                                ),
                              )}
                            />
                          </span>
                        </div>
                      </div>
                      {parseFloat(
                        subtract(
                          subtract(invoice.total_gross, invoice.total_payments),
                          multiply(
                            invoice.total_credit_notes || "0",
                            invoice.is_refund ? -1 : 1,
                          ),
                        ).toString(),
                      ) > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex gap-2 items-start">
                          <CareIcon
                            icon="l-exclamation-triangle"
                            className="text-yellow-600 size-5 mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-yellow-800">
                            {t("mark_as_balanced_warning")}
                          </p>
                        </div>
                      )}
                    </>
                  ) : selectedStatus === InvoiceStatus.entered_in_error ? (
                    <p>{t("are_you_sure_want_to_mark_as_error")}</p>
                  ) : (
                    <p>{t("are_you_sure_want_to_cancel_invoice")}</p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDialogSubmit}
                id="confirm-invoice-status-change"
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
                <ShortcutBadge actionId="submit-action" />
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={activePaymentsDialogOpen}
          onOpenChange={setActivePaymentsDialogOpen}
        >
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedStatus === InvoiceStatus.entered_in_error
                  ? t("mark_as_entered_in_error_warning")
                  : t("cancel_invoice_warning")}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    {t("invoice_has_active_payments_or_credit_notes_warning")}
                  </p>

                  {/* Active Payments Summary */}
                  {invoice?.payments?.filter(
                    (p) => p.status === PaymentReconciliationStatus.active,
                  ).length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        {t("active_payments")}
                      </div>
                      {invoice.payments
                        .filter(
                          (p) =>
                            p.status === PaymentReconciliationStatus.active,
                        )
                        .map((payment, index) => (
                          <div
                            key={payment.id}
                            className="flex justify-between text-sm border-t border-gray-100 pt-1"
                          >
                            <span className="text-gray-600">
                              {index + 1}.{" "}
                              {
                                PAYMENT_RECONCILIATION_METHOD_MAP[
                                  payment.method
                                ]
                              }
                              {payment.reference_number &&
                                ` (${payment.reference_number})`}
                            </span>
                            <span className="font-medium text-gray-900">
                              <MonetaryDisplay amount={payment.amount} />
                            </span>
                          </div>
                        ))}
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-medium">
                        <span className="text-gray-700">{t("total")}</span>
                        <span className="text-green-600">
                          <MonetaryDisplay amount={invoice.total_payments} />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Active Credit Notes Summary */}
                  {invoice?.credit_notes?.filter(
                    (p) => p.status === PaymentReconciliationStatus.active,
                  ).length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        {t("active_credit_notes")}
                      </div>
                      {invoice.credit_notes
                        .filter(
                          (p) =>
                            p.status === PaymentReconciliationStatus.active,
                        )
                        .map((creditNote, index) => (
                          <div
                            key={creditNote.id}
                            className="flex justify-between text-sm border-t border-gray-100 pt-1"
                          >
                            <span className="text-gray-600">
                              {index + 1}.{" "}
                              {
                                PAYMENT_RECONCILIATION_METHOD_MAP[
                                  creditNote.method
                                ]
                              }
                              {creditNote.reference_number &&
                                ` (${creditNote.reference_number})`}
                            </span>
                            <span className="font-medium text-gray-900">
                              <MonetaryDisplay amount={creditNote.amount} />
                            </span>
                          </div>
                        ))}
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-medium">
                        <span className="text-gray-700">{t("total")}</span>
                        <span className="text-red-600">
                          <MonetaryDisplay
                            amount={invoice.total_credit_notes}
                          />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedStatus(null)}>
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setActivePaymentsDialogOpen(false);
                  setReasonDialogOpen(true);
                }}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                {t("proceed")}
                <ShortcutBadge actionId="submit-action" />
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

        <div className="flex gap-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-14 bg-white rounded-full border border-gray-200">
              <FileCheck className="size-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-950">
                {t("invoice_updated")}
              </span>
              <p className="text-sm text-gray-600">
                {t("by_label", { label: formatName(invoice.updated_by) })}
              </p>
              <p className="text-xs text-gray-500">
                {formatDateTime(
                  invoice.modified_date,
                  "hh:mm A - MMM DD, YYYY",
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-14 bg-white rounded-full border border-gray-200">
              <ReceiptText className="size-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-950">
                {t("draft_invoice_created")}
              </span>
              <p className="text-sm text-gray-600">
                {t("by_label", { label: formatName(invoice.created_by) })}
              </p>
              <p className="text-xs text-gray-500">
                {formatDateTime(invoice.created_date, "hh:mm A - MMM DD, YYYY")}
              </p>
            </div>
          </div>
        </div>

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
                  <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
                  {alertButtonText}
                  <ShortcutBadge actionId="navigate-to-source" />
                </Button>
              </div>
            </AlertTitle>
          </Alert>
        )}
      </div>
    </DisablingCover>
  );
}

export default InvoiceShow;
