export const getInventoryBasePath = (
  facilityId: string,
  locationId: string,
  internal: boolean,
  order: boolean,
  isRequester: boolean,
  tail: string = "",
) => {
  return `/facility/${facilityId}/locations/${locationId}/${
    internal ? "internal" : "external"
  }/${order ? "orders" : "deliveries"}/${isRequester ? "outgoing" : "incoming"}/${tail}`;
};
