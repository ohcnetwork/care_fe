import { useQuery } from "@tanstack/react-query";
import { formatDate } from "date-fns";
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
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import query from "@/Utils/request/query";

export interface SelectedLot {
  selectedInventoryId: string;
  quantity: number;
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
}: StockLotSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredInventories = enableSearch
    ? inventories.filter((inv) =>
        inv.product.batch?.lot_number
          ?.toLowerCase()
          .includes(searchQuery.trim().toLowerCase()),
      )
    : inventories;

  const toggleLotSelection = (inventoryId: string) => {
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
            quantity: 1,
          },
        ]);
      } else {
        onLotSelectionChange([
          {
            selectedInventoryId: inventoryId,
            quantity: 1,
          },
        ]);
      }
    }
  };

  return (
    <Popover>
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
                    className="flex items-center justify-between w-full bg-gray-50 px-px py-0.5 border-gray-200 border-1 rounded-sm text-gray-950 gap-1"
                  >
                    <span className="font-medium text-sm ml-1">
                      {selectedInventory?.product.batch?.lot_number}
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
                          selectedInventory?.net_content > 0
                            ? "primary"
                            : "destructive"
                        }
                        className="border-none rounded-sm"
                      >
                        {selectedInventory?.net_content}{" "}
                        {selectedInventory?.product.product_knowledge.base_unit
                          .display || t("units")}
                      </Badge>
                      {showexpiry &&
                        selectedInventory?.product.expiration_date && (
                          <Badge
                            variant={
                              selectedInventory.status === "active" &&
                              new Date(
                                selectedInventory.product.expiration_date,
                              ) >= new Date()
                                ? "primary"
                                : "destructive"
                            }
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
      <PopoverContent className="w-auto p-0">
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
          {filteredInventories?.length ? (
            filteredInventories.map((inv) => {
              const isSelected = selectedLots.some(
                (lot) => lot.selectedInventoryId === inv.id,
              );

              return (
                <div
                  key={inv.id}
                  className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-accent"
                  onClick={() => toggleLotSelection(inv.id)}
                >
                  <Checkbox checked={isSelected} className="mr-2" />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span>{inv.product.batch?.lot_number}</span>
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
                          inv.status === "active" && inv.net_content > 0
                            ? "primary"
                            : "destructive"
                        }
                      >
                        {inv.net_content}{" "}
                        {inv.product.product_knowledge.base_unit.display ||
                          t("units")}
                      </Badge>
                      {inv.product?.expiration_date && (
                        <Badge
                          variant={
                            inv.status === "active" &&
                            new Date(inv.product.expiration_date) >= new Date()
                              ? "primary"
                              : "destructive"
                          }
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
