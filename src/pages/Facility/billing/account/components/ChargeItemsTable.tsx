import { CheckedState } from "@radix-ui/react-checkbox";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ExternalLinkIcon,
  PlusIcon,
  PrinterIcon,
  Zap,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  chargeItemServiceResourceFilter,
  chargeItemStatusFilter,
  createdByFilter,
  dateFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { FilterDateRange } from "@/components/ui/multi-filter/utils/Utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SearchInput from "@/components/Common/SearchInput";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
  ChargeItemServiceResource,
  MRP_CODE,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { UserReadMinimal } from "@/types/user/user";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { EditInvoiceDialog } from "@/components/Billing/Invoice/EditInvoiceDialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import AddChargeItemsBillingSheet from "./AddChargeItemsBillingSheet";
import ChangeAccountSheet from "./ChangeAccountSheet";
import ChargeItemActionsMenu from "./ChargeItemActions";
import QuickAddChargeItemsSheet from "./QuickAddChargeItemsSheet";

interface PriceComponentRowProps {
  label: string;
  components: MonetaryComponent[];
}

function PriceComponentRow({ label, components }: PriceComponentRowProps) {
  if (!components.length) return null;

  return (
    <>
      {components.map((component, index) => {
        return (
          <TableRow key={`${label}-${index}`} className="text-xs text-gray-500">
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell>
              {component.code && `${component.code.display} `}({label})
            </TableCell>
            <TableCell></TableCell>
            <TableCell>
              <MonetaryDisplay {...component} />
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export interface ChargeItemsTableProps {
  facilityId: string;
  accountId: string;
  patientId: string;
}
export function ChargeItemsTable({
  facilityId,
  accountId,
  patientId,
}: ChargeItemsTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [isAddChargeItemsOpen, setIsAddChargeItemsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChargeItem, setSelectedChargeItem] =
    useState<ChargeItemRead | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isChangeAccountOpen, setIsChangeAccountOpen] = useState(false);

  // Register shortcuts for this table
  useShortcutSubContext("facility:billing");
  const { qParams, updateQuery } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // MultiFilter configuration
  const filters = [
    chargeItemStatusFilter("status"),
    chargeItemServiceResourceFilter("service_resource"),
    createdByFilter("created_by"),
    dateFilter("created_date", t("created_date")),
  ];

  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    const query = { ...filterQuery };
    for (const [key, value] of Object.entries(query)) {
      switch (key) {
        case "service_resource":
          query.service_resource = (value as string[])?.join(",");
          break;
        case "created_by": {
          const createdByValue = value as
            | UserReadMinimal
            | UserReadMinimal[]
            | undefined;
          const user = Array.isArray(createdByValue)
            ? createdByValue[0]
            : createdByValue;
          query.created_by = user?.id || undefined;
          break;
        }
      }
    }
    updateQuery(query);
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    status: qParams.status ? [qParams.status] : undefined,
    service_resource: qParams.service_resource
      ? qParams.service_resource.split(",")
      : undefined,
    created_by: [],
    created_date:
      qParams.created_date_after || qParams.created_date_before
        ? {
            from: qParams.created_date_after
              ? new Date(qParams.created_date_after as string)
              : undefined,
            to: qParams.created_date_before
              ? new Date(qParams.created_date_before as string)
              : undefined,
          }
        : undefined,
  });

  // Convert date filter values to API query params
  const getDateQueryParams = () => {
    const dateRange = selectedFilters.created_date?.selected as
      | FilterDateRange
      | undefined;
    if (!dateRange) return {};
    return {
      created_date_after: dateRange.from?.toISOString(),
      created_date_before: dateRange.to?.toISOString(),
    };
  };

  const RESULTS_PER_PAGE = 20;
  const { ref: loadMoreRef, inView } = useInView();

  const {
    data: chargeItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["infinite-chargeItems", accountId, qParams],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(chargeItemApi.listChargeItem, {
        pathParams: { facilityId },
        queryParams: {
          account: accountId,
          status: qParams.status,
          service_resource: qParams.service_resource,
          created_by: qParams.created_by,
          ordering: qParams.ordering,
          title: qParams.title,
          limit: RESULTS_PER_PAGE,
          offset: pageParam,
          ...getDateQueryParams(),
        },
      })({ signal });
      return response as { results: ChargeItemRead[]; count: number };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * RESULTS_PER_PAGE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    select: (data) => data?.pages.flatMap((p) => p.results) ?? [],
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const handleChargeItemsAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["infinite-chargeItems", accountId],
    });
    setSelectedItems(new Set());
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && chargeItems) {
      setSelectedItems(new Set(chargeItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const selectedChargeItems =
    chargeItems?.filter((item) => selectedItems.has(item.id)) ?? [];

  useEffect(() => {
    if (!chargeItems?.length) {
      if (selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
      return;
    }

    const validIds = new Set(chargeItems.map((item) => item.id));
    setSelectedItems((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [chargeItems, selectedItems.size]);

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getComponentsByType = (
    item: ChargeItemRead,
    type: MonetaryComponentType,
  ) => {
    return (
      item.unit_price_components?.filter(
        (c) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const getLinkedResource = (item: ChargeItemRead) => {
    if (!item.service_resource || !item.service_resource_id) return "";
    switch (item.service_resource) {
      case ChargeItemServiceResource.service_request:
        return `/facility/${facilityId}/service_requests/${item.service_resource_id}`;
      case ChargeItemServiceResource.appointment:
        return `/facility/${facilityId}/patient/${patientId}/appointments/${item.service_resource_id}`;
      default:
        return "";
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <MultiFilter
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onOperationChange={handleOperationChange}
          onClearAll={handleClearAll}
          onClearFilter={handleClearFilter}
          className="flex flex-row-reverse flex-wrap sm:items-center"
          facilityId={facilityId}
        />
        <div className="flex sm:flex-row flex-col sm:items-center gap-2 w-full sm:w-auto">
          <div className="gap-2 flex items-center whitespace-nowrap">
            <Label htmlFor="sort-by-title">{t("sort_by_title")}</Label>
            <Switch
              id="sort-by-title"
              checked={qParams.ordering === "title"}
              onCheckedChange={(checked) =>
                updateQuery({ ordering: checked ? "title" : undefined })
              }
            />
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`../${accountId}/charge_items/print`)}
            className="w-full sm:w-auto"
          >
            <PrinterIcon className="size-4 mr-2" />
            {t("print_charge_items")}
            <ShortcutBadge actionId="print-button" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsQuickAddOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300 hover:from-amber-100 hover:to-orange-100"
          >
            <Zap className="size-4 mr-2 text-amber-500" />
            {t("quick_add")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAddChargeItemsOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusIcon className="size-4 mr-2" />
            {t("add_charge_items")}
            <ShortcutBadge actionId="add-charge-item" />
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <SearchInput
          id="charge-item-title-search"
          options={[
            {
              key: "title",
              type: "text",
              placeholder: t("search_by_item"),
              value: qParams.title || "",
              display: t("title"),
            },
          ]}
          className="w-full sm:w-80"
          onSearch={(key, value) => updateQuery({ [key]: value })}
        />
      </div>
      {selectedItems.size > 0 && chargeItems?.length && (
        <div className="mb-4 flex items-center gap-3 rounded-md border bg-primary/5 border-primary/20 p-3">
          <span className="text-sm font-medium">
            {selectedItems.size} {t("items_selected")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChangeAccountOpen(true)}
          >
            <ArrowRightLeft className="size-4 mr-2" />
            {t("change_account")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedItems(new Set())}
          >
            {t("clear_selection")}
          </Button>
        </div>
      )}
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : !chargeItems?.length ? (
        <EmptyState
          icon={<CareIcon icon="l-receipt" className="text-primary size-6" />}
          title={t("no_charge_items")}
        />
      ) : (
        <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
          <Table className="rounded-lg border shadow-sm w-full bg-white">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b">
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-10">
                  <Checkbox
                    checked={
                      !!chargeItems?.length &&
                      chargeItems.every((item) => selectedItems.has(item.id))
                    }
                    onCheckedChange={(checked: CheckedState) =>
                      handleSelectAll(checked === true)
                    }
                    aria-label={t("select_all")}
                  />
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-10"></TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("created_by")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("item")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("resource")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("unit_price")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("quantity")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("total")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("performer")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-[120px]">
                  {t("status")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-[60px]">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {chargeItems.flatMap((item) => {
                const isExpanded = expandedItems[item.id] || false;
                const linkedResource = getLinkedResource(item);

                const mrpAmount = item.unit_price_components.find(
                  (c) =>
                    c.monetary_component_type ===
                      MonetaryComponentType.informational &&
                    c.code?.code === MRP_CODE,
                )?.amount;
                const mainRow = (
                  <TableRow
                    key={item.id}
                    className={`border-b hover:bg-gray-50 ${selectedItems.has(item.id) ? "bg-primary/5" : ""}`}
                  >
                    <TableCell className="border-x p-3 text-gray-950">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked: CheckedState) =>
                          handleSelectItem(item.id, checked === true)
                        }
                        aria-label={t("select_item")}
                      />
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleItemExpand(item.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="border-x p-3 text-xs">
                      <p className="text-gray-950">
                        {formatName(item.created_by)}
                      </p>
                      <p className="text-gray-500">
                        {formatDateTime(item.created_date)}
                      </p>
                    </TableCell>
                    <TableCell className="bor-medium">
                      {item.title}
                      {item.description && (
                        <p className="text-xs text-gray-500 whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      {linkedResource !== "" ? (
                        <Link
                          href={linkedResource}
                          className="flex items-center gap-0.5 underline text-gray-600"
                        >
                          {t(item.service_resource)}
                          <ExternalLinkIcon className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-500">
                          {t(item.service_resource)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      <MonetaryDisplay
                        amount={getBaseComponent(item)?.amount || "0"}
                      />
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      {round(item.quantity)}
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950 font-medium">
                      <MonetaryDisplay amount={item.total_price} />
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      {formatName(item.performer_actor)}
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      <div className="flex items-center gap-1">
                        <Badge variant={CHARGE_ITEM_STATUS_COLORS[item.status]}>
                          {t(item.status)}
                        </Badge>
                        {item.paid_invoice && (
                          <Link
                            href={`/facility/${facilityId}/billing/invoices/${item.paid_invoice.id}`}
                            className="flex items-center gap-0.5 underline text-gray-600"
                            title={t("view_invoice")}
                          >
                            {item.paid_invoice.number}
                            <ExternalLinkIcon className="size-3.5" />
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border-x p-3 text-gray-950">
                      <ChargeItemActionsMenu
                        item={item}
                        facilityId={facilityId}
                        accountId={accountId}
                        onEdit={(item) => {
                          setSelectedChargeItem(item);
                          setIsEditDialogOpen(true);
                        }}
                        onChangeAccount={(item) => {
                          setSelectedItems(new Set([item.id]));
                          setIsChangeAccountOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );

                if (!isExpanded) return [mainRow];

                const detailRows = [
                  <PriceComponentRow
                    key={`${item.id}-discounts`}
                    label={t("discounts")}
                    components={getComponentsByType(
                      item,
                      MonetaryComponentType.discount,
                    )}
                  />,
                  <PriceComponentRow
                    key={`${item.id}-taxes`}
                    label={t("taxes")}
                    components={getComponentsByType(
                      item,
                      MonetaryComponentType.tax,
                    )}
                  />,
                ];

                const mrpRow = mrpAmount ? (
                  <TableRow
                    key={`${item.id}-mrp`}
                    className="text-xs text-gray-500"
                  >
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell>{t("mrp")}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      <MonetaryDisplay amount={mrpAmount} />
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ) : null;

                // Add a summary row
                const summaryRow = (
                  <TableRow
                    key={`${item.id}-summary`}
                    className="bg-muted/30 font-medium border-b"
                  >
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-gray-950">
                      {t("total")}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="p-3">
                      <MonetaryDisplay amount={item.total_price} />
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                );

                const emptyRow = (
                  <TableRow key={`${item.id}-empty`} className="bg-muted">
                    <TableCell colSpan={11}></TableCell>
                  </TableRow>
                );

                return [
                  mainRow,
                  mrpRow,
                  ...detailRows,
                  summaryRow,
                  emptyRow,
                ].filter(Boolean);
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage && <TableSkeleton count={3} />}
        </div>
      )}

      <AddChargeItemsBillingSheet
        open={isAddChargeItemsOpen}
        onOpenChange={setIsAddChargeItemsOpen}
        facilityId={facilityId}
        patientId={patientId}
        accountId={accountId}
        onChargeItemsAdded={handleChargeItemsAdded}
      />

      <QuickAddChargeItemsSheet
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        facilityId={facilityId}
        patientId={patientId}
        accountId={accountId}
        onChargeItemsAdded={handleChargeItemsAdded}
      />

      <EditInvoiceDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedChargeItem(null);
          }
        }}
        facilityId={facilityId}
        chargeItems={selectedChargeItem ? [selectedChargeItem] : []}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["infinite-chargeItems", accountId],
          });
        }}
        title={t("edit_charge_item")}
      />

      <ChangeAccountSheet
        open={isChangeAccountOpen}
        onOpenChange={setIsChangeAccountOpen}
        facilityId={facilityId}
        patientId={patientId}
        currentAccountId={accountId}
        chargeItems={selectedChargeItems}
        onSuccess={handleChargeItemsAdded}
      />
    </div>
  );
}

export default ChargeItemsTable;
