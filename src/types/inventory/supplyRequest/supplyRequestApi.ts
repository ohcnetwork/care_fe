import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { RequestOrderRetrieve } from "@/types/inventory/requestOrder/requestOrder";
import {
  SupplyRequestBase,
  SupplyRequestCreate,
  SupplyRequestRead,
  SupplyRequestUpsert,
} from "@/types/inventory/supplyRequest/supplyRequest";

export default {
  listSupplyRequest: {
    path: "/api/v1/supply_request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<SupplyRequestRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveSupplyRequest: {
    path: "/api/v1/supply_request/{supplyRequestId}/",
    method: HttpMethod.GET,
    TRes: Type<SupplyRequestRead>(),
  },
  createSupplyRequest: {
    path: "/api/v1/supply_request/",
    method: HttpMethod.POST,
    TRes: Type<SupplyRequestBase>(),
    TBody: Type<SupplyRequestCreate>(),
  },
  upsertSupplyRequest: {
    path: "/api/v1/supply_request/upsert/",
    method: HttpMethod.POST,
    TRes: Type<SupplyRequestBase>(),
    TBody: Type<{ datapoints: SupplyRequestUpsert[] }>(),
  },
  updateSupplyRequest: {
    path: "/api/v1/supply_request/{supplyRequestId}/",
    method: HttpMethod.PUT,
    TRes: Type<SupplyRequestBase>(),
    TBody: Type<SupplyRequestCreate>(),
  },
  updateSupplyRequestAsReceiver: {
    path: "/api/v1/supply_request/{supplyRequestId}/update_as_receiver/",
    method: HttpMethod.PUT,
    TRes: Type<SupplyRequestBase>(),
    TBody: Type<SupplyRequestCreate>(),
  },
  requestOrders: {
    path: "/api/v1/supply_request/request_orders/",
    method: HttpMethod.GET,
    TQueryParams: Type<{ delivery_order: string }>(),
    TRes: Type<PaginatedResponse<RequestOrderRetrieve>>(),
  },
} as const;
