import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { TokenGenerateWithQueue, TokenRead } from "@/types/tokens/token/token";

import {
  TokenQueueCreate,
  TokenQueueRead,
  TokenQueueRetrieveSpec,
  TokenQueueUpdate,
} from "@/types/tokens/tokenQueue/tokenQueue";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/token/queue/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TokenQueueRead>>(),
  },
  get: {
    path: "/api/v1/facility/{facility_id}/token/queue/{id}/",
    method: HttpMethod.GET,
    TRes: Type<TokenQueueRetrieveSpec>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/token/queue/",
    method: HttpMethod.POST,
    TRes: Type<TokenQueueRead>(),
    TBody: Type<TokenQueueCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/token/queue/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<TokenQueueRead>(),
    TBody: Type<TokenQueueUpdate>(),
  },
  setPrimary: {
    path: "/api/v1/facility/{facility_id}/token/queue/{id}/set_primary/",
    method: HttpMethod.POST,
    TRes: Type<TokenQueueRead>(),
  },
  generateToken: {
    path: "/api/v1/facility/{facility_id}/token/queue/generate_token/",
    method: HttpMethod.POST,
    TRes: Type<TokenRead>(),
    TBody: Type<TokenGenerateWithQueue>(),
  },
  setNextTokenToSubQueue: {
    path: "/api/v1/facility/{facility_id}/token/queue/{id}/set_next_token_to_subqueue/",
    method: HttpMethod.POST,
    TRes: Type<TokenRead>(),
    TBody: Type<{ sub_queue: string; category?: string }>(),
  },
} as const;
