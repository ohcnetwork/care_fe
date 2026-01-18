import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  endOfMonth,
  formatDate,
  isBefore,
  startOfMonth,
} from "date-fns";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { cn } from "@/lib/utils";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { isPositive, round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import careConfig from "@careConfig";

export interface SelectedLot {
  selectedInventoryId: string;
  quantity: string;
}

interface StockLotSelectorProps {
  selectedLots: SelectedLot[];
  onLotSelectionChange: (lots: SelectedLot[]) => void;
  placeholder?: string;
  className?: string;
  showexpiry?: boolean;
  enableSearch?: boolean;
  multiSelect?: boolean;
  facilityId?: string;
  locationId?: string;
  productKnowledge?: ProductKnowledgeBase;
  availableInventories?: InventoryRead[];
  dontRestrictExpired?: boolean;
}

export default function StockLotSelector({
  selectedLots,
  onLotSelectionChange,
  placeholder,
  className = "",
  showexpiry = true,
  enableSearch = false,
  multiSelect = false,
  facilityId,
  locationId,
  productKnowledge,
  availableInventories,
  dontRestrictExpired = false,
}: StockLotSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const expiryMonthOffset = careConfig.inventory.expiryMonthOffset;

  type ExpiryStatus = "expired" | "expiring_soon" | "valid";

  const getExpiryStatus = (
    expirationDate: string | undefined,
  ): ExpiryStatus => {
    if (!expirationDate) return "valid";
    const expiryDate = new Date(expirationDate);
    const currentMonthStart = startOfMonth(new Date());
    if (isBefore(expiryDate, currentMonthStart)) return "expired";
    if (expiryMonthOffset !== null) {
      const referenceMonthEnd = endOfMonth(
        addMonths(new Date(), expiryMonthOffset),
      );
      if (isBefore(expiryDate, referenceMonthEnd)) return "expiring_soon";
    }
    return "valid";
  };

  const isProductRestricted = (expirationDate: string | undefined): boolean => {
    const status = getExpiryStatus(expirationDate);
    return status === "expired" || status === "expiring_soon";
  };

  const getExpiryBadgeVariant = (
    expirationDate: string | undefined,
  ): "destructive" | "yellow" | "primary" => {
    const status = getExpiryStatus(expirationDate);
    if (status === "expired") return "destructive";
    if (status === "expiring_soon") return "yellow";
    return "primary";
  };

  const { data: queryInventories } = useQuery({
    queryKey: ["inventoryItems", facilityId, locationId, productKnowledge?.id],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId: facilityId!, locationId: locationId! },
      queryParams: {
        net_content_gt: 0,
        product_knowledge: productKnowledge?.id || "",
        limit: 100,
      },
    }),
    enabled: Boolean(facilityId && locationId && productKnowledge?.id),
  });

  const inventories = queryInventories?.results || availableInventories || [];

  const selectedLotsWithInventory = selectedLots.filter(
    (lot) => lot.selectedInventoryId,
  );

  const filteredInventories =
    enableSearch && searchQuery
      ? inventories.filter((inv) =>
          inv.product.batch?.lot_number
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
        )
      : inventories;

  const toggleLotSelection = (inventoryId: string, isRestricted: boolean) => {
    if (!dontRestrictExpired && isRestricted) {
      return;
    }

    const isSelected = selectedLots.some(
      (lot) => lot.selectedInventoryId === inventoryId,
    );

    if (isSelected) {
      onLotSelectionChange(
        selectedLots.filter((lot) => lot.selectedInventoryId !== inventoryId),
      );
    } else {
      if (multiSelect) {
        onLotSelectionChange([
          ...selectedLots,
          {
            selectedInventoryId: inventoryId,
            quantity: "1",
          },
        ]);
      } else {
        onLotSelectionChange([
          {
            selectedInventoryId: inventoryId,
            quantity: "1",
          },
        ]);
      }
    }
  };

  return (
    <Popover modal>
      <PopoverTrigger>
        <Button
          variant="outline"
          className={`w-auto min-w-40 h-auto justify-between p-1 border-gray-300 border ${className}`}
          type="button"
        >
          <div className="flex flex-col min-w-40 items-start gap-1 w-full">
            {selectedLotsWithInventory.length === 0 ? (
              <span className="text-gray-500">
                {placeholder || t("select_stock")}
              </span>
            ) : (
              selectedLotsWithInventory.map((lot) => {
                const selectedInventory = inventories.find(
                  (inv) => inv.id === lot.selectedInventoryId,
                );

                return (
                  <div
                    key={lot.selectedInventoryId}
                    className="flex items-center justify-between w-full bg-gray-50 px-px py-0.5 border-gray-200 border rounded-sm text-gray-950 gap-1"
                  >
                    <span
                      className={cn(
                        "font-medium text-sm ml-1 truncate max-w-24",
                        !selectedInventory?.product.batch?.lot_number &&
                          "text-gray-500",
                      )}
                      title={
                        selectedInventory?.product.batch?.lot_number ||
                        t("unknown")
                      }
                    >
                      {selectedInventory?.product.batch?.lot_number ||
                        t("unknown")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge>
                        <MonetaryDisplay
                          amount={
                            selectedInventory?.product.charge_item_definition?.price_components?.find(
                              (c) =>
                                c.monetary_component_type ===
                                MonetaryComponentType.base,
                            )?.amount
                          }
                        />
                      </Badge>
                      <Badge
                        variant={
                          selectedInventory?.status === "active" &&
                          isPositive(selectedInventory?.net_content || 0)
                            ? "primary"
                            : "destructive"
                        }
                        className="border-none rounded-sm"
                      >
                        {selectedInventory && (
                          <>{round(selectedInventory.net_content)} </>
                        )}
                        {selectedInventory?.product.product_knowledge.base_unit
                          .display || t("units")}
                      </Badge>
                      {showexpiry &&
                        selectedInventory?.product.expiration_date && (
                          <Badge
                            variant={getExpiryBadgeVariant(
                              selectedInventory.product.expiration_date,
                            )}
                            className="border-none rounded-sm"
                          >
                            {t("expiry")}:{" "}
                            {selectedInventory.product.expiration_date
                              ? formatDate(
                                  selectedInventory.product.expiration_date,
                                  "dd/MM/yyyy",
                                )
                              : "-"}
                          </Badge>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <ChevronDownIcon className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[90vw] p-0">
        {enableSearch && (
          <div className="p-2 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}
        <div className="max-h-60 overflow-auto">
          {!dontRestrictExpired &&
            filteredInventories?.some((inv) =>
              isProductRestricted(inv.product.expiration_date),
            ) && (
              <div className="px-2 py-1 bg-red-50 border-b border-red-100">
                <span className="text-xs text-red-600">
                  {t("expired_product_cannot_be_dispensed")}
                </span>
              </div>
            )}
          {filteredInventories?.length ? (
            filteredInventories.map((inv) => {
              const isSelected = selectedLots.some(
                (lot) => lot.selectedInventoryId === inv.id,
              );
              const isRestricted = isProductRestricted(
                inv.product.expiration_date,
              );
              const isDisabled = !dontRestrictExpired && isRestricted;

              return (
                <div
                  key={inv.id}
                  className={`flex items-center space-x-2 p-2 ${
                    isDisabled
                      ? "cursor-not-allowed opacity-50 bg-gray-50"
                      : "cursor-pointer hover:bg-accent"
                  }`}
                  onClick={() => toggleLotSelection(inv.id, isRestricted)}
                >
                  <Checkbox checked={isSelected} disabled={isDisabled} />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        !inv.product.batch?.lot_number && "text-gray-500",
                      )}
                    >
                      {inv.product.batch?.lot_number || t("unknown")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge>
                        <MonetaryDisplay
                          amount={
                            inv.product.charge_item_definition?.price_components.find(
                              (c) =>
                                c.monetary_component_type ===
                                MonetaryComponentType.base,
                            )?.amount
                          }
                        />
                      </Badge>
                      <Badge
                        variant={
                          inv.status === "active" && isPositive(inv.net_content)
                            ? "primary"
                            : "destructive"
                        }
                      >
                        {round(inv.net_content)}{" "}
                        {inv.product.product_knowledge.base_unit.display ||
                          t("units")}
                      </Badge>
                      {inv.product?.expiration_date && (
                        <Badge
                          variant={getExpiryBadgeVariant(
                            inv.product.expiration_date,
                          )}
                        >
                          {t("expiry")}:{" "}
                          {inv.product.expiration_date
                            ? formatDate(
                                inv.product.expiration_date,
                                "dd/MM/yyyy",
                              )
                            : "-"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              {enableSearch && searchQuery
                ? t("no_results_found")
                : t("no_lots_found")}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
