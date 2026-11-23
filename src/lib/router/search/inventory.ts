import { z } from "zod";

import {
  paginationSearch,
  searchDate,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";
import { InventoryStatusOptions } from "@/types/inventory/product/inventory";
import {
  RequestOrderPriority,
  RequestOrderStatus,
} from "@/types/inventory/requestOrder/requestOrder";

/** The stock of a location (`InventoryList`). */
export const inventoryListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(InventoryStatusOptions),
  product_knowledge_id: searchString(),
  product_expiration_date_after: searchDate(),
  product_expiration_date_before: searchDate(),
  ordering: searchString(),
});

/** Keys of every list on the To Dispatch and To Receive pages. */
const transferListFields = {
  ...paginationSearch,
  priority: searchEnum(RequestOrderPriority),
};

/** To Dispatch, requests tab: the stock requests to this location. */
export const dispatchOrderListSearch = z.object({
  ...transferListFields,
  status: searchEnum(RequestOrderStatus),
  date_after: searchDate(),
  date_before: searchDate(),
});

/** To Dispatch, deliveries tab: the deliveries from this location. */
export const dispatchDeliveryListSearch = z.object({
  ...transferListFields,
  /** Comma-separated `DeliveryOrderStatus` values. */
  status: searchString(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

/** To Receive, requests tab: the stock requests from this location. */
export const receiveOrderListSearch = z.object({
  ...transferListFields,
  /** Comma-separated `RequestOrderStatus` values. */
  status: searchString(),
  date_after: searchDate(),
  date_before: searchDate(),
});

/** To Receive, deliveries tab: the deliveries to this location. */
export const receiveDeliveryListSearch = z.object({
  ...transferListFields,
  status: searchEnum(DeliveryOrderStatus),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

/**
 * The To Dispatch and To Receive pages. Their tabs share the route and read
 * `status` with different values, so the route reads it as a string; each
 * tab parses its own schema.
 */
export const transferPageSearch = z.object({
  ...transferListFields,
  status: searchString(),
  date_after: searchDate(),
  date_before: searchDate(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

/**
 * The purchase orders (`ExternalPurchasesList`) and inward entries
 * (`DeliveryOrderList`) of a location.
 */
export const externalSupplyListSearch = z.object({
  ...paginationSearch,
  /** The selected tab: one status or comma-separated statuses. */
  tab: searchString(),
  supplier: searchString(),
  priority: searchEnum(RequestOrderPriority),
});

/** The delivery order form and page. */
export const deliveryOrderPageSearch = z.object({
  /**
   * The request order that the delivery fills. Set by the request order
   * page, and by the form for the new delivery's page.
   */
  supplyOrder: searchString(),
});
