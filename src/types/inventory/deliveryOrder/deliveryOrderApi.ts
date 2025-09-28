import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  DeliveryOrderCreate,
  DeliveryOrderRetrieve,
  DeliveryOrderUpdate,
} from "@/types/inventory/deliveryOrder/deliveryOrder";

export default {
  listRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/delivery/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DeliveryOrderRetrieve>>(),
  },
  retrieveRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/delivery/{deliveryOrderId}/",
    method: HttpMethod.GET,
    TRes: Type<DeliveryOrderRetrieve>(),
  },
  createRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/delivery/",
    method: HttpMethod.POST,
    TRes: Type<DeliveryOrderRetrieve>(),
    TBody: Type<DeliveryOrderCreate>(),
  },
  updateRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/delivery/{deliveryOrderId}/",
    method: HttpMethod.PUT,
    TRes: Type<DeliveryOrderRetrieve>(),
    TBody: Type<DeliveryOrderUpdate>(),
  },
} as const;
