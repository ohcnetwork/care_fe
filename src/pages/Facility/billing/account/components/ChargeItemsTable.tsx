import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ExternalLinkIcon,
  PlusIcon,
  PrinterIcon,
  Zap,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  chargeItemServiceResourceFilter,
  chargeItemStatusFilter,
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
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { EditInvoiceDialog } from "@/components/Billing/Invoice/EditInvoiceDialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import AddChargeItemsBillingSheet from "./AddChargeItemsBillingSheet";
import { ChargeItemActionsMenu } from "./ChargeItemActions";
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

  // Register shortcuts for this table
  useShortcutSubContext("facility:billing");
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // MultiFilter configuration
  const filters = [
    chargeItemStatusFilter("status"),
    chargeItemServiceResourceFilter("service_resource"),
    dateFilter("created_date", t("created_date")),
  ];

  const onFilterUpdate = (query: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(query)) {
      switch (key) {
        case "service_resource":
          query.service_resource = (value as string[])?.join(",");
          break;
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

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["chargeItems", accountId, qParams],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: qParams.status,
        service_resource: qParams.service_resource,
        ordering: qParams.ordering,
        title: qParams.title,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ...getDateQueryParams(),
      },
    }),
  }) as {
    data: { results: ChargeItemRead[]; count: number } | undefined;
    isLoading: boolean;
  };

  const handleChargeItemsAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["chargeItems", accountId, qParams],
    });
  };

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
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : !chargeItems?.results?.length ? (
        <EmptyState
          icon={<CareIcon icon="l-receipt" className="text-primary size-6" />}
          title={t("no_charge_items")}
        />
      ) : (
        <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
          <Table className="rounded-lg border shadow-sm w-full bg-white">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b">
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-10"></TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("item")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("resource")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("mrp")}
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
              {chargeItems.results.flatMap((item) => {
                const isExpanded = expandedItems[item.id] || false;
                const linkedResource = getLinkedResource(item);

                const mrpAmount = item.unit_price_components.find(
                  (c) =>
                    c.monetary_component_type ===
                      MonetaryComponentType.informational &&
                    c.code?.code === MRP_CODE,
                )?.amount;
                const mainRow = (
                  <TableRow key={item.id} className="border-b hover:bg-gray-50">
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
                      <MonetaryDisplay amount={mrpAmount} />
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

                // Add a summary row
                const summaryRow = (
                  <TableRow
                    key={`${item.id}-summary`}
                    className="bg-muted/30 font-medium border-b"
                  >
                    <TableCell></TableCell>
                    <TableCell className="text-gray-950">
                      {t("total")}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="p-3">
                      <MonetaryDisplay amount={item.total_price} />
                    </TableCell>
                    <TableCell className="text-gray-700 text-xs">
                      <p>
                        {t("created_by_user", {
                          name: formatName(item.created_by),
                        })}
                      </p>
                      <p>{formatDateTime(item.created_date)}</p>
                    </TableCell>
                    <TableCell className="text-gray-700 text-xs">
                      <p>
                        {t("updated_by_user", {
                          name: formatName(item.updated_by),
                        })}
                      </p>
                      <p>{formatDateTime(item.modified_date)}</p>
                    </TableCell>
                  </TableRow>
                );

                const emptyRow = (
                  <TableRow key={`${item.id}-empty`} className="bg-muted">
                    <TableCell colSpan={7}></TableCell>
                  </TableRow>
                );

                return [mainRow, ...detailRows, summaryRow, emptyRow].filter(
                  Boolean,
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination totalCount={chargeItems?.count || 0} />

      <AddChargeItemsBillingSheet
        open={isAddChargeItemsOpen}
        onOpenChange={setIsAddChargeItemsOpen}
        facilityId={facilityId}
        patientId={patientId}
        onChargeItemsAdded={handleChargeItemsAdded}
      />

      <QuickAddChargeItemsSheet
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        facilityId={facilityId}
        patientId={patientId}
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
            queryKey: ["chargeItems", accountId],
          });
        }}
        title={t("edit_charge_item")}
      />
    </div>
  );
}

export default ChargeItemsTable;
