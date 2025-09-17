import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  TokenCategoryCreate,
  TokenCategoryRead,
  TokenCategoryUpdate,
} from "@/types/tokens/tokenCategory/tokenCategory";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/token/category/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TokenCategoryRead>>(),
  },
  get: {
    path: "/api/v1/facility/{facility_id}/token/category/{id}/",
    method: HttpMethod.GET,
    TRes: Type<TokenCategoryRead>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/token/category/",
    method: HttpMethod.POST,
    TRes: Type<TokenCategoryRead>(),
    TBody: Type<TokenCategoryCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/token/category/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<TokenCategoryRead>(),
    TBody: Type<TokenCategoryUpdate>(),
  },
  setDefault: {
    path: "/api/v1/facility/{facility_id}/token/category/{id}/set_default/",
    method: HttpMethod.POST,
    TRes: Type<TokenCategoryRead>(),
  },
} as const;
