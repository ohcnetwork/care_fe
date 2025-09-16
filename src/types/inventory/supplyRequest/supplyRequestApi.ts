import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
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
} as const;
