import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  DispenseOrderCreate,
  DispenseOrderRetrieve,
  DispenseOrderUpdate,
} from "@/types/emr/dispenseOrder/dispenseOrder";

export default {
  listRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/dispense/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DispenseOrderRetrieve>>(),
  },
  retrieveRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/dispense/{dispenseOrderId}/",
    method: HttpMethod.GET,
    TRes: Type<DispenseOrderRetrieve>(),
  },
  createRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/dispense/",
    method: HttpMethod.POST,
    TRes: Type<DispenseOrderRetrieve>(),
    TBody: Type<DispenseOrderCreate>(),
  },
  updateRequestOrder: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/order/dispense/{dispenseOrderId}/",
    method: HttpMethod.PUT,
    TRes: Type<DispenseOrderRetrieve>(),
    TBody: Type<DispenseOrderUpdate>(),
  },
} as const;
