import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ResourceRequestCreate,
  ResourceRequestListRead,
  ResourceRequestRead,
} from "@/types/resourceRequest/resourceRequest";

export default {
  get: {
    path: "/api/v1/resource/{resourceRequestId}/",
    method: HttpMethod.GET,
    TRes: Type<ResourceRequestRead>(),
  },
  list: {
    path: "/api/v1/resource/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ResourceRequestListRead>>(),
  },
  create: {
    path: "/api/v1/resource/",
    method: HttpMethod.POST,
    TBody: Type<ResourceRequestCreate>(),
    TRes: Type<ResourceRequestRead>(),
  },
  update: {
    path: "/api/v1/resource/{resourceRequestId}/",
    method: HttpMethod.PUT,
    TBody: Type<ResourceRequestCreate>(),
    TRes: Type<ResourceRequestRead>(),
  },
};
