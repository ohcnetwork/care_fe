import {
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

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

export const getCompletedDeliveryQuantity = (delivery: SupplyDeliveryRead) => {
  if (delivery.status !== SupplyDeliveryStatus.completed) {
    return 0;
  }
  return delivery.supplied_item_quantity;
};
