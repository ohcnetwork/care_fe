import { LotSelection } from "@/pages/Facility/services/inventory/InventoryItemsSelector";
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
// TODO: check ensure expired items are not selected
export const selectEligibleInventoryItems = (
  items: InventoryRead[],
  options: Options,
) => {
  const selected: LotSelection[] = [];

  // Start with the full required quantity, and reduce it as we select items
  let remainingQuantity = options.quantity.ceil();

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
