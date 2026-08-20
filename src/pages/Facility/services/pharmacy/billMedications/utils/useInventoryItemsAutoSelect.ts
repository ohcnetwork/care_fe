import { computeMedicationDispenseQuantity } from "@/components/Medicine/utils";
import { getExpirationDateThresholdForDispensing } from "@/pages/Facility/services/inventory/utils";
import { LotSelection } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { decimal, isGreaterThan, roundWhole } from "@/Utils/decimal";
import { isLotAllowedForDispensing } from "@/Utils/inventory";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useEffect } from "react";

interface InventoryItemsAutoSelectOptions {
  facilityId: string;
  locationId: string;
  productKnowledge: ProductKnowledgeBase | null;
  dosageInstructions: MedicationRequestDosageInstruction[];
  onSelect: (lots: ReturnType<typeof selectLots>) => void;
  enabled?: boolean;
}

/**
 * Custom hook to auto-select eligible inventory items based on product
 * knowledge and dosage instructions.
 */
export const useInventoryItemsAutoSelect = ({
  facilityId,
  locationId,
  productKnowledge,
  dosageInstructions,
  onSelect,
  enabled = true,
}: InventoryItemsAutoSelectOptions) => {
  const quantity = computeMedicationDispenseQuantity(dosageInstructions);

  const canAutoSelectInventoryItems =
    !!productKnowledge && !!quantity && isGreaterThan(quantity, 0);

  const {
    data,
    refetch,
    isFetching: isAutoSelecting,
  } = useQuery({
    queryKey: [
      "dispensableItems",
      facilityId,
      locationId,
      productKnowledge?.id,
      { quantity }, // Voluntarily adding `quantity` to the query key to ensure re-fetching when it changes
    ],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        product_knowledge: productKnowledge?.id || "",
        status: "active",
        limit: 100,
        net_content_gt: 0,
        ordering: "product__expiration_date",
        product_expiration_date_after:
          getExpirationDateThresholdForDispensing().toISOString(),
      },
    }),
    enabled: canAutoSelectInventoryItems && enabled,
  });

  // Auto-select on mount and when the product knowledge or quantity changes
  useEffect(() => {
    if (canAutoSelectInventoryItems && enabled && data) {
      onSelect(selectLots(data.results, decimal(quantity)));
    }
  }, [canAutoSelectInventoryItems, enabled, data]);

  return {
    canAutoSelectInventoryItems,
    isAutoSelectingInventoryItems: isAutoSelecting,
    autoSelectInventoryItems() {
      if (canAutoSelectInventoryItems) {
        refetch();
      }
    },
  };
};

/**
 * Auto-select inventory items based on the provided options.
 * It iterates through the items and selects them until the desired quantity is
 * met or there are no more items to select.
 * The canSelect function is used to determine if an item is eligible for
 * selection.
 *
 * Quantity is always dealt in whole numbers. If item's available content is
 * 1.5, it will be rounded down to 1.
 * If required quantity is 1.5, it will be rounded up to 2.
 */
const selectLots = (items: InventoryRead[], quantity: Decimal) => {
  const selected: LotSelection[] = [];

  // Start with the full required quantity, and reduce it as we select items
  let remainingQuantity = quantity.ceil();

  for (const item of items) {
    // Escape hatch to prevent unnecessary iterations once we've met the required quantity
    if (remainingQuantity.lte(0)) {
      break;
    }

    const availableQuantity = decimal(item.net_content).floor();

    // Skip items that don't meet the canSelect criteria
    if (isLotAllowedForDispensing(item) == false || availableQuantity.lte(0)) {
      continue;
    }

    if (availableQuantity.lte(remainingQuantity)) {
      // If the entire available quantity of the item can be used, select it all
      selected.push({
        item,
        quantity: roundWhole(availableQuantity),
        autoSelected: true,
      });
      remainingQuantity = remainingQuantity.minus(availableQuantity);
    } else {
      // Otherwise, select only the remaining quantity needed and stop
      selected.push({
        item,
        quantity: roundWhole(remainingQuantity),
        autoSelected: true,
      });
      remainingQuantity = new Decimal(0);
    }
  }

  return selected;
};
