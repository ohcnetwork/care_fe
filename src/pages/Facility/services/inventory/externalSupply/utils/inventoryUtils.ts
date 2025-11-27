import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
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

export function calculateTotal(
  delivery: SupplyDeliveryRead,
  internal: boolean,
): number {
  const priceComponents = internal
    ? delivery.supplied_inventory_item?.product?.charge_item_definition
        ?.price_components
    : delivery.supplied_item?.charge_item_definition?.price_components;

  if (!priceComponents) return 0;

  const baseComponent = priceComponents.find(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  );
  const basePrice = baseComponent?.amount
    ? parseFloat(baseComponent.amount)
    : 0;
  const quantity = delivery.supplied_item_quantity || 1;

  let total = basePrice * quantity;

  // Apply taxes
  priceComponents
    .filter((c) => c.monetary_component_type === MonetaryComponentType.tax)
    .forEach((tax) => {
      if (tax.factor) {
        total += basePrice * quantity * (tax.factor / 100);
      } else if (tax.amount) {
        total += parseFloat(tax.amount);
      }
    });

  // Apply discounts
  priceComponents
    .filter((c) => c.monetary_component_type === MonetaryComponentType.discount)
    .forEach((discount) => {
      if (discount.factor) {
        total -= basePrice * quantity * (discount.factor / 100);
      } else if (discount.amount) {
        total -= parseFloat(discount.amount);
      }
    });

  return total;
}
