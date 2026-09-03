import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BanIcon,
  ChevronDown,
  ExternalLinkIcon,
  EyeIcon,
  PlayCircle,
  PrinterIcon,
} from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

import { cn } from "@/lib/utils";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { DispenseItemsTableCard } from "@/pages/Facility/services/pharmacy/components/DispenseGroupCard";
import { DispenseOrderViewFooter } from "@/pages/Facility/services/pharmacy/components/DispenseOrderViewFooter";
import { PaymentStatusBanner } from "@/pages/Facility/services/pharmacy/components/PaymentStatusBanner";
import useUpdateDispenseOrderStatus from "@/pages/Facility/services/pharmacy/hooks/useUpdateDispenseOrderStatus";

import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceList, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  DISPENSE_ORDER_STATUS_STYLES,
  DispenseOrderStatus,
  MAX_DISPENSES_PER_DISPENSE_ORDER,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import {
  MEDICATION_DISPENSE_CANCELLED_STATUSES,
  MedicationDispenseRead,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

import { AddDispenseMedicationRow } from "@/pages/Facility/services/pharmacy/components/AddDispenseMedicationRow";
import { extractInvoicesFromDispenses } from "@/pages/Facility/services/pharmacy/utils/extractInvoicesFromDispenses";
import usePatientDefaultBillingAccount from "@/types/billing/account/hooks/useDefaultBillingAccount";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
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

  const [showCancelled, setShowCancelled] = useState(false);

  const [{ autoAdvanceStatus }, setQParams] = useQueryParams<{
    autoAdvanceStatus?: string;
  }>();

  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
  });

  const {
    data: activeDispenses = [],
    isLoading: isLoadingActiveDispenses,
    isFetching: isFetchingActiveDispenses,
  } = useQuery({
    queryKey: ["medication_dispense", dispenseOrderId, locationId, "active"],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        location: locationId,
        order: dispenseOrderId,
        limit: MAX_DISPENSES_PER_DISPENSE_ORDER,
        exclude_status: MEDICATION_DISPENSE_CANCELLED_STATUSES.join(","),
      },
    }),
    select: (data: PaginatedResponse<MedicationDispenseRead>) => data.results,
  });

  const {
    data: cancelledDispenses = [],
    isLoading: isLoadingCancelledDispenses,
    isFetching: isFetchingCancelledDispenses,
  } = useQuery({
    queryKey: ["medication_dispense", dispenseOrderId, locationId, "cancelled"],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        location: locationId,
        order: dispenseOrderId,
        limit: MAX_DISPENSES_PER_DISPENSE_ORDER,
        status: MEDICATION_DISPENSE_CANCELLED_STATUSES.join(","),
      },
    }),
    select: (data: PaginatedResponse<MedicationDispenseRead>) => data.results,
  });

  const isLoadingDispenses =
    isLoadingActiveDispenses || isLoadingCancelledDispenses;
  const isFetchingDispenses =
    isFetchingActiveDispenses || isFetchingCancelledDispenses;

  // Combined view (active + cancelled) for computations that need every
  // dispense of the order. Memoized to preserve reference stability for
  // downstream memo dependencies.
  const dispenses = useMemo(
    () => [...activeDispenses, ...cancelledDispenses],
    [activeDispenses, cancelledDispenses],
  );

  const relatedPrescriptionIds = Array.from(
    new Set(
      activeDispenses
        .map((d) => d.authorizing_request?.prescription?.id)
        .filter((id): id is string => !!id),
    ),
  );

  // Encounter for medications added directly to this order (they have no
  // authorizing request). Any dispense's encounter works — prefer one from an
  // authorizing request, else recover it from the first dispense's retrieve
  // shape.
  const knownEncounterId = dispenses.find(
    (d) => d.authorizing_request?.encounter,
  )?.authorizing_request?.encounter;
  const { data: firstDispenseRetrieve } = useQuery({
    queryKey: ["medication_dispense_retrieve", dispenses[0]?.id],
    queryFn: query(medicationDispenseApi.get, {
      pathParams: { id: dispenses[0]?.id ?? "" },
    }),
    enabled: !knownEncounterId && !!dispenses[0]?.id,
  });
  const orderEncounterId =
    knownEncounterId ?? firstDispenseRetrieve?.encounter.id;

  const { data: account } = usePatientDefaultBillingAccount({
    facilityId,
    patientId: dispenseOrder?.patient.id,
  });

  const billableItems = dispenses.filter(
    (d) =>
      d.charge_item?.status === ChargeItemStatus.billable &&
      !MEDICATION_DISPENSE_CANCELLED_STATUSES.includes(d.status),
  );

  const invoices = extractInvoicesFromDispenses(dispenses);

  // Group active dispenses: one group per active invoice, plus an "unbilled"
  // bucket for dispenses whose charge item has no active invoice. Cancelled
  // dispenses are fetched via a separate query. Unbilled first, then invoice
  // groups ordered oldest → newest.
  const { unbilledDispenses, invoiceGroups } = useMemo(() => {
    const unbilled: MedicationDispenseRead[] = [];
    const byInvoice = new Map<
      string,
      { meta: InvoiceList; dispenses: MedicationDispenseRead[] }
    >();
    activeDispenses.forEach((dispense) => {
      const inv = dispense.charge_item?.paid_invoice;
      if (inv) {
        const group = byInvoice.get(inv.id) ?? { meta: inv, dispenses: [] };
        group.dispenses.push(dispense);
        byInvoice.set(inv.id, group);
      } else {
        unbilled.push(dispense);
      }
    });
    const groups = Array.from(byInvoice.values()).sort(
      (a, b) =>
        new Date(a.meta.created_date).getTime() -
        new Date(b.meta.created_date).getTime(),
    );
    return {
      unbilledDispenses: unbilled,
      invoiceGroups: groups,
    };
  }, [activeDispenses]);

  // True when the order has at least one non-cancelled dispense.
  const hasNonCancelledDispenses = useMemo(
    () =>
      dispenses.some(
        (d) => !MEDICATION_DISPENSE_CANCELLED_STATUSES.includes(d.status),
      ),
    [dispenses],
  );

  const isOrderOpen =
    dispenseOrder?.status === DispenseOrderStatus.draft ||
    dispenseOrder?.status === DispenseOrderStatus.in_progress;

  const isOrderCancelled =
    dispenseOrder?.status === DispenseOrderStatus.abandoned ||
    dispenseOrder?.status === DispenseOrderStatus.entered_in_error;

  const isOrderCompleted =
    dispenseOrder?.status === DispenseOrderStatus.completed;

  // Block in-app navigation and browser back/refresh while order is open
  // TODO: figure out a UX to allow preview RX, invoice prints and all while the order is open, without triggering this prompt.
  // useNavigationPrompt(
  //   !isFetchingOrder && isOrderOpen,
  //   t("dispense_order_leave_warning"),
  // );

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateDispenseOrderStatus({
      facilityId,
      locationId,
      dispenseOrder: dispenseOrder!,
      dispenses,
      onSuccess: () => {
        // TODO: add this when completed page gets mini print previews
        // if (newStatus === DispenseOrderStatus.completed) {
        //   navigate(
        //     `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/completed`,
        //     { replace: true },
        //   );
        // }
      },
    });

  // When navigated here right after billing (`?autoAdvanceStatus=true`),
  // advance the freshly created draft order to in_progress exactly once.
  const autoAdvanceTriggered = useRef(false);
  useEffect(() => {
    if (
      autoAdvanceStatus === "true" &&
      !autoAdvanceTriggered.current &&
      dispenseOrder?.status === DispenseOrderStatus.draft
    ) {
      autoAdvanceTriggered.current = true;
      setQParams({}, { replace: true });
      updateStatus({ newStatus: DispenseOrderStatus.in_progress });
    }
  }, [autoAdvanceStatus, dispenseOrder?.status, setQParams, updateStatus]);

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["medication_dispense", dispenseOrderId, locationId],
    });
    queryClient.invalidateQueries({
      queryKey: ["accounts", dispenseOrder?.patient.id],
    });
    queryClient.invalidateQueries({ queryKey: ["invoice"] });

    // Any billing activity (create / issue invoice, collect payment) implies
    // the order is actively being worked on — bump it from draft to in_progress.
    if (dispenseOrder?.status === DispenseOrderStatus.draft) {
      updateStatus({ newStatus: DispenseOrderStatus.in_progress });
    }
  };

  const { mutate: createInvoice, isPending: isCreatingInvoice } = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_created_successfully"));
      handlePaymentSuccess();
    },
  });

  const handleCreateInvoice = (items: ChargeItemRead[]) => {
    if (!account?.id) return;
    createInvoice({
      status: InvoiceStatus.draft,
      account: account.id,
      charge_items: items.map((item) => item.id),
    });
  };

  if (isLoadingOrder || isLoadingDispenses) {
    return <TableSkeleton count={5} />;
  }

  if (!dispenseOrder) {
    return <ErrorPage />;
  }

  // Filter dispenses by status + search; applied per-group for display.
  const matchesFilter = (m: MedicationDispenseRead) => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (searchQuery) {
      const name = m.item.product.product_knowledge.name?.toLowerCase() || "";
      if (!name.includes(searchQuery)) return false;
    }
    return true;
  };

  const filteredDispenses = dispenses.filter(matchesFilter);

  // Payment banners are suppressed for cancelled orders — the patient header
  // surfaces the next-action buttons instead.
  const showBanners = !isOrderCancelled;

  // Charge items of medications added directly to the order attach to the
  // first draft invoice, if any. With no draft invoice they stay unbilled and
  // the user can create an invoice manually.
  const draftInvoiceId = invoices.find(
    (inv) => inv.status === InvoiceStatus.draft,
  )?.id;

  // Adding is only possible when the new charge items can still land somewhere
  // editable: a draft invoice, an order with no invoices yet, or alongside
  // existing unbilled dispenses.
  const canAddMedication =
    !!draftInvoiceId ||
    invoiceGroups.length === 0 ||
    unbilledDispenses.length > 0;

  // Placeholder "add row" rendered below the dispense tables while the order
  // is open.
  const addMedicationRow =
    orderEncounterId && isOrderOpen && canAddMedication ? (
      <AddDispenseMedicationRow
        facilityId={facilityId}
        locationId={locationId}
        dispenseOrderId={dispenseOrderId}
        encounterId={orderEncounterId}
        draftInvoiceId={draftInvoiceId}
      />
    ) : null;

  // Per-row edit context; the replacement dispense's charge item is appended
  // to the draft invoice, if any.
  const editContext = isOrderOpen
    ? { facilityId, locationId, draftInvoiceId }
    : undefined;

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
      </div>

      {/* Patient header card with Account button on right */}
      <Card className="mb-3 pr-2 rounded-md shadow-none bg-white border flex items-center justify-between">
        <PatientHeader
          patient={dispenseOrder.patient}
          facilityId={facilityId}
        />

        {isOrderCancelled ? (
          <div className="flex flex-wrap items-center gap-2">
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
          <>
            {account?.id && (
              <Button variant="link" className="underline" asChild>
                <Link
                  href={`/facility/${facilityId}/billing/account/${account.id}`}
                  basePath="/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("account")}
                  <ExternalLinkIcon />
                </Link>
              </Button>
            )}
          </>
        )}
      </Card>

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
        {!!relatedPrescriptionIds.length && (
          <Button
            variant="link"
            asChild
            className="text-gray-700 hover:text-gray-900"
          >
            <Link
              href={`/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${dispenseOrder.patient.id}/prescriptions/${relatedPrescriptionIds.join(",")}`}
              basePath="/"
            >
              <EyeIcon className="size-4" />
              {t("preview_rx")}
            </Link>
          </Button>
        )}
      </div>

      {/* Dispense groups (by invoice) */}
      {filteredDispenses.length === 0 ? (
        <div className="flex flex-col gap-6">
          <EmptyState
            title={t("no_medications_found")}
            description={t("no_medications_found_description")}
            icon={<CareIcon icon="l-tablets" className="text-primary size-6" />}
          />
          {addMedicationRow}
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-24">
          {/* Placeholder shown when every dispense in the order is cancelled */}
          {!hasNonCancelledDispenses && (
            <EmptyState
              title={t("no_active_dispenses")}
              description={t("no_active_dispenses_description")}
              icon={<BanIcon className="text-gray-400 size-6" />}
            />
          )}

          {/* Unbilled group — dispenses not yet settled in an active invoice */}
          {(() => {
            const groupDispenses = unbilledDispenses.filter(matchesFilter);
            if (groupDispenses.length === 0) return null;
            return (
              <div className="flex flex-col gap-3">
                {showBanners && (
                  <PaymentStatusBanner
                    facilityId={facilityId}
                    accountId={account?.id}
                    invoiceId={undefined}
                    unbilledItems={billableItems
                      .map((dispense) => dispense.charge_item)
                      .filter((item): item is ChargeItemRead => !!item)}
                    onCreateInvoice={handleCreateInvoice}
                    isCreatingInvoice={isCreatingInvoice}
                    onPaymentSuccess={handlePaymentSuccess}
                    readOnly={!isOrderOpen}
                  />
                )}
                <DispenseItemsTableCard
                  dispenses={groupDispenses}
                  edit={editContext}
                  isFetching={isFetchingDispenses}
                  orderClosed={isOrderCancelled || isOrderCompleted}
                />
              </div>
            );
          })()}

          {/* One group per invoice */}
          {invoiceGroups.map((group) => {
            const groupDispenses = group.dispenses.filter(matchesFilter);
            if (groupDispenses.length === 0) return null;
            return (
              <div key={group.meta.id} className="flex flex-col gap-3">
                {showBanners && (
                  <PaymentStatusBanner
                    facilityId={facilityId}
                    accountId={account?.id}
                    invoiceId={group.meta.id}
                    unbilledItems={[]}
                    onPaymentSuccess={handlePaymentSuccess}
                    readOnly={!isOrderOpen}
                  />
                )}
                <DispenseItemsTableCard
                  dispenses={groupDispenses}
                  edit={editContext}
                  isFetching={isFetchingDispenses}
                  orderClosed={isOrderCancelled || isOrderCompleted}
                />
              </div>
            );
          })}

          {/* Placeholder row to add a new medication to the order */}
          {addMedicationRow}

          {/* Cancelled dispenses — collapsible, always shown last */}
          {(() => {
            const groupDispenses = cancelledDispenses.filter(matchesFilter);
            if (groupDispenses.length === 0) return null;
            return (
              <Collapsible
                open={showCancelled || !hasNonCancelledDispenses}
                onOpenChange={setShowCancelled}
                className="flex flex-col gap-3"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <BanIcon className="size-4 text-gray-500" />
                    {t("cancelled_dispenses")}
                    <Badge variant="secondary">{groupDispenses.length}</Badge>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-gray-500 transition-transform",
                      (showCancelled || !hasNonCancelledDispenses) &&
                        "rotate-180",
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <DispenseItemsTableCard
                    dispenses={groupDispenses}
                    orderClosed={isOrderCancelled || isOrderCompleted}
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })()}
        </div>
      )}

      {/* Audit information (location, created, updated) */}
      <div
        className={cn(
          "mt-6 flex items-start gap-x-8 gap-y-2 text-sm flex-wrap border-t border-gray-200 pt-4",
          (isOrderOpen || isOrderCompleted) && "pb-16",
        )}
      >
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
            <span className="text-xs text-gray-500">{t("updated")}:</span>
            <span className="font-semibold text-gray-900 text-xs">
              {dispenseOrder.updated_by
                ? formatName(dispenseOrder.updated_by)
                : t("unknown")}
              <span className="text-gray-400 mx-1.5">·</span>
              <span className="text-gray-700 font-normal">
                {format(dispenseOrder.modified_date, "PPPpp")}
              </span>
            </span>
          </div>
        )}
      </div>

      <DispenseOrderViewFooter
        facilityId={facilityId}
        locationId={locationId}
        dispenseOrder={dispenseOrder}
        dispenses={dispenses}
        hasNonCancelledDispenses={hasNonCancelledDispenses}
        updateStatus={updateStatus}
        isUpdatingStatus={isUpdatingStatus}
      />
    </Page>
  );
}
