import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  DeliveryOrderCreate,
  DeliveryOrderRetrieve,
  DeliveryOrderUpdate,
} from "@/types/inventory/deliveryOrder/deliveryOrder";

export default {
  listDeliveryOrder: {
    path: "/api/v1/facility/{facilityId}/order/delivery/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DeliveryOrderRetrieve>>(),
  },
  retrieveDeliveryOrder: {
    path: "/api/v1/facility/{facilityId}/order/delivery/{deliveryOrderId}/",
    method: HttpMethod.GET,
    TRes: Type<DeliveryOrderRetrieve>(),
  },
  createDeliveryOrder: {
    path: "/api/v1/facility/{facilityId}/order/delivery/",
    method: HttpMethod.POST,
    TRes: Type<DeliveryOrderRetrieve>(),
    TBody: Type<DeliveryOrderCreate>(),
  },
  updateDeliveryOrder: {
    path: "/api/v1/facility/{facilityId}/order/delivery/{deliveryOrderId}/",
    method: HttpMethod.PUT,
    TRes: Type<DeliveryOrderRetrieve>(),
    TBody: Type<DeliveryOrderUpdate>(),
  },
} as const;
