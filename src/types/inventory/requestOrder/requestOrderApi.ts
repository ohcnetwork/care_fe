import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  RequestOrderCreate,
  RequestOrderRetrieve,
  RequestOrderUpdate,
} from "@/types/inventory/requestOrder/requestOrder";

export default {
  listRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<RequestOrderRetrieve>>(),
  },
  retrieveRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/request/{requestOrderId}/",
    method: HttpMethod.GET,
    TRes: Type<RequestOrderRetrieve>(),
  },
  createRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/request/",
    method: HttpMethod.POST,
    TRes: Type<RequestOrderRetrieve>(),
    TBody: Type<RequestOrderCreate>(),
  },
  updateRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/request/{requestOrderId}/",
    method: HttpMethod.PUT,
    TRes: Type<RequestOrderRetrieve>(),
    TBody: Type<RequestOrderUpdate>(),
  },
} as const;
