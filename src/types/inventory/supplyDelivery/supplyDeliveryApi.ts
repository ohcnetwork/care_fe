import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
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
} as const;
