import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FadeInText from "@/components/ui/fade-in-text";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LotSelection } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { isPositive, roundWhole } from "@/Utils/decimal";
import {
  formatLotExpiry,
  getExpiryBadgeVariant,
  isProductRestrictedFromDispensing,
} from "@/Utils/inventory";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";

interface Props {
  facilityId: string;
  locationId: string;
  productKnowledgeId: string;
  showOnlyAvailable?: boolean;
  value?: LotSelection;
  selected: LotSelection[];
  onChange: (selectedItems: LotSelection[]) => void;
  disabled?: boolean;
}

export const InventoryItemsSelector = ({
  facilityId,
  locationId,
  productKnowledgeId,
  showOnlyAvailable = false,
  value,
  selected,
  onChange,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventoryItems", facilityId, locationId, productKnowledgeId],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        product_knowledge: productKnowledgeId,
        status: "active",
        limit: 100,
        ...(showOnlyAvailable ? { net_content_gt: 0 } : {}),
      },
    }),
    select: (data: PaginatedResponse<InventoryRead>) => data.results,
  });

  // Filter items by lot/batch number search
  const filteredItems =
    searchQuery && items
      ? items.filter((inv) =>
          inv.product.batch?.lot_number
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
        )
      : items || [];

  // Toggle lot selection
  const toggleLotSelection = (
    inventory: InventoryRead,
    isRestricted: boolean,
  ) => {
    if (isRestricted) return;

    const isSelected = selected.some(({ item }) => item.id === inventory.id);

    if (isSelected) {
      // Remove from selection
      onChange(selected.filter(({ item }) => item.id !== inventory.id));
    } else {
      // Add to selection
      onChange([
        ...selected,
        {
          item: inventory,
          quantity: "1",
          autoSelected: false,
        },
      ]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  // No stock state
  if (!items || items.length === 0) {
    return <Badge variant="destructive">{t("no_stock")}</Badge>;
  }

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="py-1 px-2 border-gray-300 shadow-none"
          type="button"
          disabled={disabled}
        >
          <div className="flex flex-col min-w-40 items-start gap-1 w-full">
            {!value ? (
              <span className="text-gray-500">{t("select_stock")}</span>
            ) : (
              <div className="flex justify-between p-1 w-full">
                <span
                  className={cn(
                    "font-medium text-sm truncate max-w-28",
                    !value.item.product.batch?.lot_number && "text-gray-500",
                  )}
                  title={value.item.product.batch?.lot_number || t("unknown")}
                >
                  {value.autoSelected ? (
                    <FadeInText
                      text={
                        value.item.product.batch?.lot_number || t("unknown")
                      }
                      delay={20}
                    />
                  ) : (
                    value.item.product.batch?.lot_number || t("unknown")
                  )}
                </span>

                {value.item.product.expiration_date && (
                  <div className="flex items-center">
                    <Badge
                      variant={getExpiryBadgeVariant(
                        value.item.product.expiration_date,
                      )}
                      className="rounded-sm text-xs px-1.5 py-0"
                    >
                      {formatLotExpiry(value.item)}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
          <ChevronDownIcon className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-(--radix-popover-trigger-width) max-w-[90vw] p-0"
        align="start"
      >
        {/* Search input */}
        <div className="p-2 border-b">
          <div className="relative ring-4 ring-gray-100 rounded-md">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 size-4" />
            <Input
              placeholder={t("search_lot_batch")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Warning for restricted items */}
        {filteredItems.some((inv) =>
          isProductRestrictedFromDispensing(inv.product.expiration_date),
        ) && (
          <div className="px-2 py-1 bg-red-50 border-b border-red-100">
            <span className="text-xs text-red-600">
              {t("expired_product_cannot_be_dispensed")}
            </span>
          </div>
        )}

        {/* Lot list table */}
        <div className="max-h-60 overflow-auto">
          {filteredItems.length > 0 ? (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-2 text-left w-10"></th>
                  <th className="p-2 text-left text-sm font-medium text-gray-600">
                    {t("lot_batch")}
                  </th>
                  <th className="p-2 text-left text-sm font-medium text-gray-600">
                    {t("unit_price")}
                  </th>
                  <th className="p-2 text-left text-sm font-medium text-gray-600">
                    {t("available_stock")}
                  </th>
                  <th className="p-2 text-left text-sm font-medium text-gray-600">
                    {t("expiry")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((inv) => {
                  const isSelected = selected.some(
                    (item) => item.item.id === inv.id,
                  );
                  const isRestricted = isProductRestrictedFromDispensing(
                    inv.product.expiration_date,
                  );

                  return (
                    <tr
                      key={inv.id}
                      className={cn(
                        "border-b last:border-b-0 transition-all duration-100 ease-in-out",
                        isRestricted
                          ? "cursor-not-allowed opacity-50 bg-gray-50"
                          : "cursor-pointer hover:bg-gray-50",
                      )}
                      onClick={() => toggleLotSelection(inv, isRestricted)}
                    >
                      <td className="p-2 pb-0.5 text-center">
                        <Checkbox
                          checked={isSelected}
                          disabled={isRestricted}
                        />
                      </td>
                      <td className="p-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !inv.product.batch?.lot_number && "text-gray-500",
                          )}
                        >
                          #{inv.product.batch?.lot_number || t("unknown")}
                        </span>
                      </td>
                      <td className="p-2">
                        <MonetaryDisplay
                          amount={
                            inv.product.charge_item_definition?.price_components?.find(
                              (c) =>
                                c.monetary_component_type ===
                                MonetaryComponentType.base,
                            )?.amount
                          }
                          className="text-sm font-medium"
                        />
                      </td>
                      <td className="p-2 text-end">
                        <Badge
                          variant={
                            inv.status === "active" &&
                            isPositive(inv.net_content)
                              ? "green"
                              : "destructive"
                          }
                          size="sm"
                          className="text-sm font-medium py-0 px-1.5"
                        >
                          {roundWhole(inv.net_content)}{" "}
                          {inv.product.product_knowledge.base_unit.display ||
                            t("units")}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {inv.product.expiration_date ? (
                          <Badge
                            variant={getExpiryBadgeVariant(
                              inv.product.expiration_date,
                            )}
                            size="sm"
                            className="text-sm font-medium py-0 px-1.5"
                          >
                            {formatLotExpiry(inv)}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? t("no_results_found") : t("no_lots_found")}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// TODO: auto close popover when quantity matches the required quantity only
