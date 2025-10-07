import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import query from "@/Utils/request/query";
import { formatDate } from "date-fns";

interface InventoryItemSelectProps {
  value: string;
  onChange: (value: string) => void;
  facilityId: string;
  locationId: string;
  productKnowledge?: ProductKnowledgeBase;
  disabled?: boolean;
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
}

export function InventoryItemSelect({
  value,
  onChange,
  facilityId,
  locationId,
  productKnowledge,
  disabled,
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
}: InventoryItemSelectProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: [
      "inventoryItems",
      facilityId,
      locationId,
      productKnowledge?.id,
      searchTerm,
    ],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        net_content_gt: 0,
        product_knowledge: productKnowledge?.id || "",
        search: searchTerm,
      },
    }),
    enabled: Boolean(productKnowledge?.id && locationId),
  });

  const options =
    inventoryItems?.results.map((item: InventoryRead) => ({
      label: `${item.product.batch?.lot_number} ${
        item.product.expiration_date
          ? `(${t("expiry")} ${formatDate(item.product.expiration_date, "dd/MM/yyyy")})`
          : ""
      } - ${item.net_content} ${item.product.product_knowledge.base_unit.display}`,
      value: item.id,
    })) || [];

  return (
    <Autocomplete
      className={"h-full"}
      options={options}
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      onSearch={setSearchTerm}
      placeholder={placeholder || t("select_inventory_item")}
      inputPlaceholder={inputPlaceholder || t("search_inventory_item")}
      noOptionsMessage={noOptionsMessage || t("no_inventory_items_found")}
      disabled={disabled || !productKnowledge?.id}
    />
  );
}
