import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ChevronDown,
  ExternalLinkIcon,
  EyeIcon,
  PauseCircle,
  PencilIcon,
  PlayCircle,
  PrinterIcon,
  RotateCcw,
  WrenchIcon,
} from "lucide-react";
import { Link, navigate, useNavigationPrompt } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { PatientHeader } from "@/components/Patient/PatientHeader";
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
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { dispenseStatusFilter } from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import {
  OtherItemsGroupCard,
  PrescriptionGroupCard,
} from "@/pages/Facility/services/pharmacy/components/DispenseGroupCard";
import { PaymentStatusBanner } from "@/pages/Facility/services/pharmacy/components/PaymentStatusBanner";
import useUpdateDispenseOrderStatus from "@/pages/Facility/services/pharmacy/hooks/useUpdateDispenseOrderStatus";
import { MedicationReturnSheet } from "@/pages/Facility/services/pharmacy/MedicationReturnSheet";
import { groupDispensesByPrescription } from "@/pages/Facility/services/pharmacy/utils/groupDispenses";

import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  DISPENSE_ORDER_STATUS_STYLES,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import {
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

import usePatientDefaultBillingAccount from "@/types/billing/account/hooks/useDefaultBillingAccount";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";
import { format } from "date-fns";

export function DispenseOrderView({
  facilityId,
  locationId,
  dispenseOrderId,
}: {
  facilityId: string;
  locationId: string;
  dispenseOrderId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  useShortcutSubContext("facility:pharmacy");

  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [searchInput, setSearchInput] = useState<string>("");
  const searchQuery = searchInput.toLowerCase();

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(
    [dispenseStatusFilter("dispense_status")],
    (update) => {
      if ("dispense_status" in update) {
        const value = update.dispense_status;
        setStatusFilter(typeof value === "string" ? value : undefined);
      }
    },
  );

  const [putOnHoldDialogOpen, setPutOnHoldDialogOpen] = useState(false);
  const [confirmStatusChange, setConfirmStatusChange] =
    useState<DispenseOrderStatus | null>(null);
  const [createInvoiceSheetOpen, setCreateInvoiceSheetOpen] = useState(false);
  const [billableChargeItems, setBillableChargeItems] = useState<
    ChargeItemRead[]
  >([]);

  const {
    data: dispenseOrder,
    isLoading: isLoadingOrder,
    isFetching: isFetchingOrder,
  } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
  });

  const { data: dispenses = [], isLoading: isLoadingDispenses } = useQuery({
    queryKey: ["medication_dispense", dispenseOrderId, locationId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        location: locationId,
        order: dispenseOrderId,
        // TODO: should we limit only billing atmost 100 in the first place or have a workaround for pagination here?
        limit: 100,
      },
    }),
    select: (data: PaginatedResponse<MedicationDispenseRead>) => data.results,
  });

  const { data: account } = usePatientDefaultBillingAccount({
    facilityId,
    patientId: dispenseOrder?.patient.id,
  });

  const billableItems = useMemo(() => {
    return dispenses
      .filter((dispense) => {
        const ci = dispense.charge_item;
        if (!ci) return false;
        if (
          ci.status === ChargeItemStatus.aborted ||
          ci.status === ChargeItemStatus.entered_in_error ||
          ci.status === ChargeItemStatus.not_billable
        ) {
          return false;
        }
        if (ci.status === ChargeItemStatus.billable) return true;
        if (
          ci.paid_invoice?.status === InvoiceStatus.cancelled ||
          ci.paid_invoice?.status === InvoiceStatus.entered_in_error
        ) {
          return true;
        }
        return false;
      })
      .map((dispense) => dispense.charge_item);
  }, [dispenses]);

  const invoiceIds = useMemo(() => {
    const ids = new Set<string>();
    dispenses.forEach((dispense) => {
      const id = dispense.charge_item?.paid_invoice?.id;
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [dispenses]);

  const invoiceQueries = useQueries({
    queries: invoiceIds.map((invoiceId) => ({
      queryKey: ["invoice", facilityId, invoiceId],
      queryFn: query(invoiceApi.retrieveInvoice, {
        pathParams: { facilityId, invoiceId },
      }),
      enabled: !!invoiceId,
    })),
  });

  const relatedInvoices = useMemo(() => {
    return invoiceQueries
      .map((q) => q.data)
      .filter((data): data is InvoiceRead => !!data);
  }, [invoiceQueries]);

  // Pick the active (non-cancelled) invoice; prefer the most recent.
  const activeInvoice = useMemo(() => {
    const active = relatedInvoices.filter(
      (inv) =>
        inv.status !== InvoiceStatus.cancelled &&
        inv.status !== InvoiceStatus.entered_in_error,
    );
    return active.sort(
      (a, b) =>
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime(),
    )[0];
  }, [relatedInvoices]);

  const hasBalancedInvoice = useMemo(
    () => relatedInvoices.some((inv) => inv.status === InvoiceStatus.balanced),
    [relatedInvoices],
  );

  // Cancelling the dispense order (abandoned / entered_in_error) is allowed
  // only when there is no invoice, or invoices are in draft state.
  const blockingInvoice = useMemo(
    () =>
      relatedInvoices.find(
        (inv) =>
          inv.status === InvoiceStatus.issued ||
          inv.status === InvoiceStatus.balanced,
      ),
    [relatedInvoices],
  );

  // True when one or more non-finalized dispenses are currently on hold.
  const hasOnHoldDispenses = useMemo(
    () => dispenses.some((d) => d.status === MedicationDispenseStatus.on_hold),
    [dispenses],
  );

  const isOrderOpen =
    dispenseOrder?.status === DispenseOrderStatus.draft ||
    dispenseOrder?.status === DispenseOrderStatus.in_progress;

  const isOrderCancelled =
    dispenseOrder?.status === DispenseOrderStatus.abandoned ||
    dispenseOrder?.status === DispenseOrderStatus.entered_in_error;

  // Block in-app navigation and browser back/refresh while order is open
  useNavigationPrompt(
    !isFetchingOrder && isOrderOpen,
    t("dispense_order_leave_warning"),
  );

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateDispenseOrderStatus({
      facilityId,
      locationId,
      dispenseOrder: dispenseOrder!,
      dispenses,
      onSuccess: (newStatus) => {
        if (newStatus === DispenseOrderStatus.completed) {
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/completed`,
            { replace: true },
          );
        }
      },
    });

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["medication_dispense", dispenseOrderId, locationId],
    });
    queryClient.invalidateQueries({
      queryKey: ["accounts", dispenseOrder?.patient.id],
    });
    invoiceIds.forEach((id) => {
      queryClient.invalidateQueries({
        queryKey: ["invoice", facilityId, id],
      });
    });

    // Any billing activity (create / issue invoice, collect payment) implies
    // the order is actively being worked on — bump it from draft to in_progress.
    if (dispenseOrder?.status === DispenseOrderStatus.draft) {
      updateStatus({ newStatus: DispenseOrderStatus.in_progress });
    }
  };

  if (isLoadingOrder || isLoadingDispenses) {
    return <TableSkeleton count={5} />;
  }

  if (!dispenseOrder) {
    return <ErrorPage />;
  }

  // Filter and group
  const filteredDispenses = dispenses.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (searchQuery) {
      const name = m.item.product.product_knowledge.name?.toLowerCase() || "";
      if (!name.includes(searchQuery)) return false;
    }
    return true;
  });

  const { prescriptionGroups, otherDispenses } =
    groupDispensesByPrescription(filteredDispenses);

  const handlePutOnHold = () => {
    updateStatus(
      { newStatus: DispenseOrderStatus.draft, hold: true },
      {
        onSuccess: () => {
          setPutOnHoldDialogOpen(false);
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_requests`,
          );
        },
      },
    );
  };

  const handleResumePreparation = () => {
    updateStatus({ newStatus: DispenseOrderStatus.draft });
  };

  const handleStartInProgress = () => {
    updateStatus({ newStatus: DispenseOrderStatus.in_progress });
  };

  return (
    <Page title={t("dispense_medicines")} hideTitleOnPage>
      {/* Top header bar: title + status pill | metadata columns */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("dispense_medicines")}
          </h1>
          <div className="flex items-center">
            <Badge variant={DISPENSE_ORDER_STATUS_STYLES[dispenseOrder.status]}>
              {t("status")}:{" "}
              {t(`dispense_order_status__${dispenseOrder.status}`)}
            </Badge>
            {dispenseOrder.status === DispenseOrderStatus.draft && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartInProgress}
                      disabled={isUpdatingStatus}
                      aria-label={t("mark_as_in_progress")}
                    >
                      <PlayCircle />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("mark_as_in_progress")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex items-start gap-x-8 gap-y-2 text-sm flex-wrap">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">{t("location")}:</span>
            <span className="font-semibold text-gray-900 text-xs">
              {dispenseOrder.location.name}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">{t("created")}:</span>
            <span className="font-semibold text-gray-900 text-xs">
              {dispenseOrder.created_by
                ? formatName(dispenseOrder.created_by)
                : t("unknown")}
              <span className="text-gray-400 mx-1.5">·</span>
              <span className="text-gray-700 font-normal">
                {format(dispenseOrder.created_date, "PPPpp")}
              </span>
            </span>
          </div>
          {dispenseOrder.modified_date !== dispenseOrder.created_date && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                {t("last_updated")}:
              </span>
              <span className="font-semibold text-gray-900 text-xs">
                {dispenseOrder.updated_by
                  ? formatName(dispenseOrder.updated_by)
                  : t("unknown")}
                <span className="text-gray-400 mx-1.5">·</span>
                <span className="text-gray-700 font-normal">
                  {formatDateTime(dispenseOrder.modified_date)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Patient header card with Account button on right */}
      <Card className="mb-3 pr-2 rounded-md shadow-none bg-white border flex items-center justify-between">
        <PatientHeader
          patient={dispenseOrder.patient}
          facilityId={facilityId}
        />

        {isOrderCancelled ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" asChild>
              <Link
                href={`/facility/${facilityId}/locations/${locationId}/medication_requests`}
                basePath="/"
              >
                {t("prescription_queue")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`/facility/${facilityId}/locations/${locationId}/medication_dispense`}
                basePath="/"
              >
                {t("go_to_dispenses")}
              </Link>
            </Button>
            {account?.id && (
              <Button variant="outline" asChild>
                <Link
                  href={`/facility/${facilityId}/billing/account/${account.id}`}
                  basePath="/"
                >
                  {t("view_account")}
                  <ExternalLinkIcon className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          // TODO: show account's balance if account balance is negative
          <Button variant="link" className="underline" asChild>
            <Link
              href={`/facility/${facilityId}/billing/account/${account?.id}`}
              basePath="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("account")}
              <ExternalLinkIcon />
            </Link>
          </Button>
        )}
      </Card>

      {/* Payment Status Banner (hidden when order is cancelled) */}
      {!isOrderCancelled && (
        <div className="mb-4">
          <PaymentStatusBanner
            facilityId={facilityId}
            accountId={account?.id}
            invoice={activeInvoice}
            unbilledItems={billableItems}
            onCreateInvoice={(items) => {
              setBillableChargeItems(items);
              setCreateInvoiceSheetOpen(true);
            }}
            onPaymentSuccess={handlePaymentSuccess}
            readOnly={!isOrderOpen}
          />
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder={t("search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <MultiFilter
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onOperationChange={handleOperationChange}
            onClearAll={handleClearAll}
            onClearFilter={handleClearFilter}
            className="flex flex-row-reverse flex-wrap sm:items-center"
            facilityId={facilityId}
          />
        </div>
        <Button
          variant="link"
          asChild
          className="text-gray-700 hover:text-gray-900"
        >
          <Link
            href={`/facility/${facilityId}/locations/${locationId}/medication_requests`}
            basePath="/"
          >
            <EyeIcon className="size-4" />
            {t("preview_rx")}
          </Link>
        </Button>
      </div>

      {/* Dispense cards */}
      {prescriptionGroups.length === 0 && otherDispenses.length === 0 ? (
        <EmptyState
          title={t("no_medications_found")}
          description={t("no_medications_found_description")}
          icon={<CareIcon icon="l-tablets" className="text-primary size-6" />}
        />
      ) : (
        <div className="flex flex-col gap-4 pb-24">
          {prescriptionGroups.map((group) => (
            <PrescriptionGroupCard
              key={group.prescription.id}
              prescription={group.prescription}
              dispenses={group.dispenses}
            />
          ))}
          {otherDispenses.length > 0 && (
            <OtherItemsGroupCard dispenses={otherDispenses} />
          )}
        </div>
      )}

      {/* Sticky footer action bar */}
      {isOrderOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-10 px-4 md:px-6 py-4 bg-white border-t border-gray-200 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col gap-0.5 text-sm text-gray-700">
            {hasBalancedInvoice ? (
              <>
                <span className="font-medium">
                  {t("payment_has_been_collected")}
                </span>{" "}
                <span className="text-red-600 font-medium">
                  {t("complete_dispense_to_proceed")}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-700">
                  {t("payment_collected_now_or_later")}
                </span>{" "}
                <span className="text-red-600 font-medium italic">
                  {t("payment_due_to_account_warning")}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* TODO: consider adding this print? */}
            {/* <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/print`,
                )
              }
            >
              <PrinterIcon className="size-4" />
              {t("print")}
            </Button> */}
            {hasOnHoldDispenses ? (
              <Button
                variant="outline"
                onClick={handleResumePreparation}
                disabled={isUpdatingStatus || hasBalancedInvoice}
                title={
                  hasBalancedInvoice
                    ? t("put_on_hold_disabled_balanced_invoice")
                    : undefined
                }
              >
                <WrenchIcon className="size-4" />
                {t("put_in_preparation")}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setPutOnHoldDialogOpen(true)}
                disabled={isUpdatingStatus || hasBalancedInvoice}
                title={
                  hasBalancedInvoice
                    ? t("put_on_hold_disabled_balanced_invoice")
                    : undefined
                }
              >
                <PauseCircle className="size-4" />
                {t("put_on_hold")}
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${dispenseOrder.patient.id}/bill/dispense_order/${dispenseOrderId}`,
                      )
                    }
                    disabled={isUpdatingStatus || !!activeInvoice}
                  >
                    <PencilIcon className="size-4" />
                    {t("edit_dispense_order")}
                  </Button>
                </span>
              </TooltipTrigger>
              {activeInvoice && (
                <TooltipContent>
                  {t("dispense_order_cannot_be_edited_due_to_invoice")}
                </TooltipContent>
              )}
            </Tooltip>
            <div className="flex">
              <Button
                variant={hasBalancedInvoice ? "primary" : "outline_primary"}
                className="rounded-r-none"
                onClick={() =>
                  updateStatus({ newStatus: DispenseOrderStatus.completed })
                }
                disabled={isUpdatingStatus}
              >
                {t("complete_dispense")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={hasBalancedInvoice ? "primary" : "outline_primary"}
                    size="icon"
                    className="rounded-l-none border-l border-l-white/20"
                    disabled={isUpdatingStatus}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[
                    DispenseOrderStatus.entered_in_error,
                    DispenseOrderStatus.abandoned,
                  ]
                    .filter((s) => s !== dispenseOrder.status)
                    .map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => setConfirmStatusChange(s)}
                        disabled={isUpdatingStatus}
                      >
                        {t(`mark_as_${s}`)}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Completed-state quick actions row (Medication Return, Print) */}
      {!isOrderOpen &&
        dispenseOrder.status === DispenseOrderStatus.completed && (
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/print`,
                )
              }
            >
              <PrinterIcon className="size-4" />
              {t("print")}
            </Button>
            <MedicationReturnSheet
              facilityId={facilityId}
              locationId={locationId}
              patient={dispenseOrder.patient}
              onSuccess={(deliveryOrder) => {
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_return/order/${deliveryOrder.id}/?dispenseOrderIds=${dispenseOrderId}`,
                );
              }}
              trigger={
                <Button variant="outline">
                  <RotateCcw className="size-4" />
                  {t("medication_return")}
                </Button>
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUpdatingStatus}
                  aria-label={t("more_actions")}
                >
                  <CareIcon icon="l-ellipsis-v" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[
                  DispenseOrderStatus.entered_in_error,
                  DispenseOrderStatus.abandoned,
                ]
                  .filter((s) => s !== dispenseOrder.status)
                  .map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setConfirmStatusChange(s)}
                      disabled={isUpdatingStatus}
                    >
                      {t(`mark_as_${s}`)}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

      {/* Put on hold confirmation */}
      <AlertDialog
        open={putOnHoldDialogOpen}
        onOpenChange={setPutOnHoldDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("put_dispense_on_hold")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("put_on_hold_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              {t("stay_on_this_page")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePutOnHold();
              }}
              disabled={isUpdatingStatus}
            >
              <ArrowLeftRight className="size-4" />
              {t("put_on_hold")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status change confirmation (entered_in_error / abandoned) */}
      <AlertDialog
        open={!!confirmStatusChange}
        onOpenChange={(open) => !open && setConfirmStatusChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmStatusChange ? t(`mark_as_${confirmStatusChange}`) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockingInvoice
                ? t("dispense_order_cannot_be_cancelled_due_to_invoice", {
                    invoiceNumber: blockingInvoice.number,
                    status: t(`invoice_status__${blockingInvoice.status}`),
                  })
                : confirmStatusChange === DispenseOrderStatus.entered_in_error
                  ? t("mark_order_as_entered_in_error_confirmation_description")
                  : t("mark_order_as_abandoned_confirmation_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              {blockingInvoice ? t("close") : t("cancel")}
            </AlertDialogCancel>
            {!blockingInvoice && (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirmStatusChange) return;
                  updateStatus(
                    { newStatus: confirmStatusChange },
                    {
                      onSuccess: () => {
                        setConfirmStatusChange(null);
                      },
                    },
                  );
                }}
                disabled={isUpdatingStatus}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t("confirm")}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create invoice sheet */}
      {account && (
        <CreateInvoiceSheet
          facilityId={facilityId}
          accountId={account.id}
          open={createInvoiceSheetOpen}
          onOpenChange={setCreateInvoiceSheetOpen}
          preSelectedChargeItems={billableChargeItems}
          sourceUrl={`/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}`}
          skipNavigation={true}
          onSuccess={() => {
            setCreateInvoiceSheetOpen(false);
            setBillableChargeItems([]);
            handlePaymentSuccess();
          }}
        />
      )}
    </Page>
  );
}

export default DispenseOrderView;
