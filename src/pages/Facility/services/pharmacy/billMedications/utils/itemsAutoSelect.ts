import { LotSelection } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { decimal, roundWhole } from "@/Utils/decimal";
import Decimal from "decimal.js";

interface Options {
  /**
   * The quantity to select.
   */
  quantity: Decimal;
  /**
   * A function to determine if an item is eligible for selection.
   */
  canSelect: (item: InventoryRead) => boolean;
}

/**
 * In-place sort items by expiration date.
 */
function sortItemsByExpirationDate(items: InventoryRead[]) {
  return items.sort((a, b) => {
    if (!a.product.expiration_date) return 1;
    if (!b.product.expiration_date) return -1;
    return (
      new Date(a.product.expiration_date).getTime() -
      new Date(b.product.expiration_date).getTime()
    );
  });
}

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
export const selectEligibleInventoryItems = (
  items: InventoryRead[],
  options: Options,
) => {
  const selected: LotSelection[] = [];

  // Start with the full required quantity, and reduce it as we select items
  let remainingQuantity = options.quantity.ceil();

  sortItemsByExpirationDate(items);

  for (const item of items) {
    // Escape hatch to prevent unnecessary iterations once we've met the required quantity
    if (remainingQuantity.lte(0)) {
      break;
    }

    const availableQuantity = decimal(item.net_content).floor();

    // Skip items that don't meet the canSelect criteria
    if (options.canSelect(item) == false || availableQuantity.lte(0)) {
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
