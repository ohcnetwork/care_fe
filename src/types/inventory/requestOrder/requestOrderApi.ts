import { TagUpdateRequest } from "@/types/emr/tagConfig/tagConfig";
import {
  RequestOrderCreate,
  RequestOrderRetrieve,
  RequestOrderUpdate,
} from "@/types/inventory/requestOrder/requestOrder";
import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

export default {
  listRequestOrder: {
    path: "/api/v1/facility/{facilityId}/order/request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<RequestOrderRetrieve>>(),
  },
  retrieveRequestOrder: {
    path: "/api/v1/facility/{facilityId}/order/request/{requestOrderId}/",
    method: HttpMethod.GET,
    TRes: Type<RequestOrderRetrieve>(),
  },
  createRequestOrder: {
    path: "/api/v1/facility/{facilityId}/order/request/",
    method: HttpMethod.POST,
    TRes: Type<RequestOrderRetrieve>(),
    TBody: Type<RequestOrderCreate>(),
  },
  updateRequestOrder: {
    path: "/api/v1/facility/{facilityId}/order/request/{requestOrderId}/",
    method: HttpMethod.PUT,
    TRes: Type<RequestOrderRetrieve>(),
    TBody: Type<RequestOrderUpdate>(),
  },
  setTags: {
    path: "/api/v1/facility/{facilityId}/order/request/{external_id}/set_tags/",
    method: HttpMethod.POST,
    TRes: Type<RequestOrderRetrieve>(),
    TBody: Type<TagUpdateRequest>(),
  },
  removeTags: {
    path: "/api/v1/facility/{facilityId}/order/request/{external_id}/remove_tags/",
    method: HttpMethod.POST,
    TRes: Type<RequestOrderRetrieve>(),
    TBody: Type<TagUpdateRequest>(),
  },
} as const;
