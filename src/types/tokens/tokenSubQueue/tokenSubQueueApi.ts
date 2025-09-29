import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  TokenSubQueueCreate,
  TokenSubQueueRead,
  TokenSubQueueUpdate,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/token/sub_queue/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TokenSubQueueRead>>(),
  },
  get: {
    path: "/api/v1/facility/{facility_id}/token/sub_queue/{id}/",
    method: HttpMethod.GET,
    TRes: Type<TokenSubQueueRead>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/token/sub_queue/",
    method: HttpMethod.POST,
    TRes: Type<TokenSubQueueRead>(),
    TBody: Type<TokenSubQueueCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/token/sub_queue/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<TokenSubQueueRead>(),
    TBody: Type<TokenSubQueueUpdate>(),
  },
} as const;
