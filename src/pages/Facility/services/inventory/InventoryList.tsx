import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { TriangleAlertIcon } from "lucide-react";
import { Link } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import useFilters from "@/hooks/useFilters";

import { isLessThan, round } from "@/Utils/decimal";
import { getExpiryBadgeVariant, getExpiryStatus } from "@/Utils/inventory";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import {
  inventoryStatusFilter,
  productExpirationDateFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import { FilterDateRange } from "@/components/ui/multi-filter/utils/Utils";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { INVENTORY_STATUS_COLORS } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { ProductKnowledgeSelect } from "./ProductKnowledgeSelect";

const SORT_OPTIONS = {
  net_content: "sort_by_lowest_net_content",
  "-net_content": "sort_by_highest_net_content",
  product__expiration_date: "sort_by_earliest_expiry",
  "-product__expiration_date": "sort_by_latest_expiry",
} as const;

interface InventoryListProps {
  facilityId: string;
  locationId: string;
}
export function InventoryList({ facilityId, locationId }: InventoryListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  // State to store the selected product knowledge object
  const [selectedProductKnowledge, setSelectedProductKnowledge] = useState<
    ProductKnowledgeBase | undefined
  >(undefined);

  // Clear selected product knowledge when query parameter is cleared
  useEffect(() => {
    if (!qParams.product_knowledge_id) {
      setSelectedProductKnowledge(undefined);
    }
  }, [qParams.product_knowledge_id]);

  const filters = useMemo(
    () => [
      inventoryStatusFilter(),
      productExpirationDateFilter(
        "product_expiration_date",
        t("expiration_date"),
      ),
    ],
    [t],
  );

  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    let query = { ...filterQuery };
    for (const [key, value] of Object.entries(filterQuery)) {
      switch (key) {
        case "product_expiration_date":
          {
            const dateRange = value as FilterDateRange | null;
            query = {
              ...query,
              product_expiration_date: undefined,
              product_expiration_date_after: dateRange?.from
                ? dateQueryString(dateRange.from)
                : undefined,
              product_expiration_date_before: dateRange?.to
                ? dateQueryString(dateRange.to)
                : undefined,
            };
          }
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
    product_expiration_date:
      qParams.product_expiration_date_after ||
      qParams.product_expiration_date_before
        ? {
            from: qParams.product_expiration_date_after
              ? parseISO(qParams.product_expiration_date_after)
              : undefined,
            to: qParams.product_expiration_date_before
              ? parseISO(qParams.product_expiration_date_before)
              : undefined,
          }
        : undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", facilityId, locationId, qParams],
    queryFn: query.debounced(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        status: qParams.status,
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        product_knowledge: qParams.product_knowledge_id,
        product_expiration_date_after: qParams.product_expiration_date_after,
        product_expiration_date_before: qParams.product_expiration_date_before,
        ordering: qParams.ordering,
      },
    }),
  });

  return (
    <Page title={t("inventory")}>
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row items-start gap-2 w-full sm:w-auto">
          <ProductKnowledgeSelect
            value={selectedProductKnowledge}
            onChange={(productKnowledge: ProductKnowledgeBase | undefined) => {
              setSelectedProductKnowledge(productKnowledge);
              updateQuery({
                product_knowledge_id: productKnowledge?.id || undefined,
              });
            }}
            placeholder={t("search_product_knowledge")}
            disableFavorites
          />
          <MultiFilter
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onOperationChange={handleOperationChange}
            onClearAll={handleClearAll}
            onClearFilter={handleClearFilter}
            placeholder={t("filters")}
            className="flex flex-row flex-wrap sm:items-center"
            triggerButtonClassName="self-start sm:self-center"
            clearAllButtonClassName="self-start"
            facilityId={facilityId}
          />
        </div>
        <div className="w-full sm:w-fit">
          <Select
            value={qParams.ordering || ""}
            onValueChange={(ordering) => updateQuery({ ordering })}
          >
            <SelectTrigger className="w-full border-gray-400 text-gray-950 rounded-sm">
              <SelectValue placeholder={t("sort_by")} />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.entries(SORT_OPTIONS).map(([ordering, label]) => (
                <SelectItem key={ordering} value={ordering}>
                  {t(label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="rounded-md border">
            <TableSkeleton count={10} />
          </div>
        ) : !data?.results?.length ? (
          <EmptyState
            icon={<CareIcon icon="l-box" className="text-primary size-6" />}
            title={t("no_inventory")}
            description={t("no_inventory_description")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("net_content")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("expiration_date")}</TableHead>
                <TableHead>{t("batch")}</TableHead>
                <TableHead>{t("base_price")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.results?.map((inventory) => (
                <TableRow key={inventory.id}>
                  <TableCell className="font-semibold">
                    <Link
                      href={`/facility/${facilityId}/settings/product/${inventory.product.id}`}
                      basePath="/"
                      className="flex items-center gap-2"
                    >
                      {inventory.product.product_knowledge.name}
                      <CareIcon
                        icon="l-external-link-alt"
                        className="size-4 text-gray-500"
                      />
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-medium space-x-1",
                      isLessThan(inventory.net_content, 10) &&
                        "text-yellow-600",
                    )}
                  >
                    <span>{round(inventory.net_content)}</span>
                    <span className="text-sm self-center">
                      {inventory.product.product_knowledge.base_unit.display}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge variant={INVENTORY_STATUS_COLORS[inventory.status]}>
                      {t(inventory.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inventory.product.expiration_date ? (
                      <div className="flex items-center gap-2">
                        <span>
                          {new Date(
                            inventory.product.expiration_date,
                          ).toLocaleDateString()}
                        </span>
                        <ExpiryStatusBadge
                          expirationDate={inventory.product.expiration_date}
                        />
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {inventory.product.batch?.lot_number || "-"}
                  </TableCell>
                  <TableCell>
                    {inventory.product.charge_item_definition && (
                      <MonetaryDisplay
                        amount={
                          inventory.product.charge_item_definition.price_components.find(
                            (c) =>
                              c.monetary_component_type ===
                              MonetaryComponentType.base,
                          )?.amount
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Pagination totalCount={data?.count || 0} />
      </div>
    </Page>
  );
}

function ExpiryStatusBadge({ expirationDate }: { expirationDate: string }) {
  const { t } = useTranslation();
  const status = getExpiryStatus(expirationDate);

  if (status === "valid") return null;

  return (
    <Badge
      variant={getExpiryBadgeVariant(expirationDate)}
      className="whitespace-nowrap"
    >
      <TriangleAlertIcon className="size-3.5" />
      {t(status)}
    </Badge>
  );
}
