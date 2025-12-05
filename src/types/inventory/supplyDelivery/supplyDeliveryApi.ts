import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { DeliveryOrderRetrieve } from "@/types/inventory/deliveryOrder/deliveryOrder";
import {
  SupplyDeliveryBase,
  SupplyDeliveryCreate,
  SupplyDeliveryRead,
  SupplyDeliveryUpdate,
  SupplyDeliveryUpsert,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

export default {
  listSupplyDelivery: {
    path: "/api/v1/supply_delivery/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<SupplyDeliveryRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveSupplyDelivery: {
    path: "/api/v1/supply_delivery/{supplyDeliveryId}/",
    method: HttpMethod.GET,
    TRes: Type<SupplyDeliveryRead>(),
  },
  createSupplyDelivery: {
    path: "/api/v1/supply_delivery/",
    method: HttpMethod.POST,
    TRes: Type<SupplyDeliveryBase>(),
    TBody: Type<SupplyDeliveryCreate>(),
  },
  upsertSupplyDelivery: {
    path: "/api/v1/supply_delivery/upsert/",
    method: HttpMethod.POST,
    TRes: Type<SupplyDeliveryBase>(),
    TBody: Type<{ datapoints: SupplyDeliveryUpsert[] }>(),
  },
  updateSupplyDelivery: {
    path: "/api/v1/supply_delivery/{supplyDeliveryId}/",
    method: HttpMethod.PUT,
    TRes: Type<SupplyDeliveryBase>(),
    TBody: Type<SupplyDeliveryUpdate>(),
  },
  updateSupplyDeliveryAsReceiver: {
    path: "/api/v1/supply_delivery/{supplyDeliveryId}/update_as_receiver/",
    method: HttpMethod.PUT,
    TRes: Type<SupplyDeliveryBase>(),
    TBody: Type<SupplyDeliveryUpdate>(),
  },
  deliveryOrders: {
    path: "/api/v1/supply_delivery/delivery_orders/",
    method: HttpMethod.GET,
    TQueryParams: Type<{ request_order: string }>(),
    TRes: Type<PaginatedResponse<DeliveryOrderRetrieve>>(),
  },
} as const;
