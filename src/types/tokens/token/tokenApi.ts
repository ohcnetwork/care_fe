import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  TokenGenerate,
  TokenRead,
  TokenUpdate,
} from "@/types/tokens/token/token";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TokenRead>>(),
  },
  get: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/{id}/",
    method: HttpMethod.GET,
    TRes: Type<TokenRead>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/",
    method: HttpMethod.POST,
    TRes: Type<TokenRead>(),
    TBody: Type<TokenGenerate>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<TokenRead>(),
    TBody: Type<TokenUpdate>(),
  },
  setNext: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/{id}/set_next/",
    method: HttpMethod.POST,
    TRes: Type<TokenRead>(),
  },
} as const;
