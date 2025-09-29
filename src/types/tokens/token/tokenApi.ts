import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse, UpsertRequest } from "@/Utils/request/types";
import {
  TokenGenerate,
  TokenRead,
  TokenRetrieve,
  TokenUpdate,
} from "@/types/tokens/token/token";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TokenRead>>(),
    defaultQueryParams: {
      ordering: "created_date",
    },
  },
  get: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/{id}/",
    method: HttpMethod.GET,
    TRes: Type<TokenRetrieve>(),
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
  upsert: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/upsert/",
    method: HttpMethod.POST,
    TRes: Type<TokenRead>(),
    TBody: Type<UpsertRequest<TokenGenerate, TokenUpdate>>(),
  },
  setNext: {
    path: "/api/v1/facility/{facility_id}/token/queue/{queue_id}/token/{id}/set_next/",
    method: HttpMethod.POST,
    TRes: Type<TokenRead>(),
  },
} as const;
