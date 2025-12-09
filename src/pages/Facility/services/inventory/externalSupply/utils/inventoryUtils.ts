import {
  calculateItemTotal,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { getComponentsFromChargeItem } from "@/types/billing/chargeItem/chargeItem";
import { SupplyDeliveryRead } from "@/types/inventory/supplyDelivery/supplyDelivery";

export const getInventoryBasePath = (
  facilityId: string,
  locationId: string,
  internal: boolean,
  isOrder: boolean,
  isRequester: boolean,
  tail: string = "",
) => {
  const base = `/facility/${facilityId}/locations/${locationId}/inventory`;
  const tab = isOrder
    ? isRequester
      ? "outgoing"
      : "incoming"
    : isRequester
      ? "incoming"
      : "outgoing";
  const resourceType = isOrder ? "orders" : "deliveries";

  if (internal) {
    const type = isRequester ? "receive" : "dispatch";
    return `${base}/internal/${type}/${resourceType}/${tail}`;
  } else {
    return `${base}/external/${resourceType}/${tab}/${tail}`;
  }
};

/**
 * Calculate total price for a supply delivery
 * Uses shared utilities for component extraction and total calculation
 */
export function calculateTotal(
  delivery: SupplyDeliveryRead,
  internal: boolean,
): number {
  const chargeItemDef = internal
    ? delivery.supplied_inventory_item?.product?.charge_item_definition
    : delivery.supplied_item?.charge_item_definition;

  if (!chargeItemDef) return 0;

  const baseComponents = getComponentsFromChargeItem(
    chargeItemDef,
    MonetaryComponentType.base,
  );
  const basePrice = baseComponents[0]?.amount
    ? parseFloat(baseComponents[0].amount)
    : 0;

  return calculateItemTotal(
    basePrice,
    delivery.supplied_item_quantity || 1,
    getComponentsFromChargeItem(chargeItemDef, MonetaryComponentType.tax),
    getComponentsFromChargeItem(chargeItemDef, MonetaryComponentType.discount),
  );
}
