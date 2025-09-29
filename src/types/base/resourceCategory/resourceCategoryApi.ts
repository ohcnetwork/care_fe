import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ResourceCategoryCreate,
  ResourceCategoryRead,
  ResourceCategoryUpdate,
} from "@/types/base/resourceCategory/resourceCategory";

export default {
  list: {
    path: "/api/v1/facility/{facilityId}/resource_category/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ResourceCategoryRead>>(),
  },
  get: {
    path: "/api/v1/facility/{facilityId}/resource_category/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<ResourceCategoryRead>(),
  },
  create: {
    path: "/api/v1/facility/{facilityId}/resource_category/",
    method: HttpMethod.POST,
    TRes: Type<ResourceCategoryRead>(),
    TBody: Type<ResourceCategoryCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facilityId}/resource_category/{slug}/",
    method: HttpMethod.PUT,
    TRes: Type<ResourceCategoryRead>(),
    TBody: Type<ResourceCategoryUpdate>(),
  },
  delete: {
    path: "/api/v1/facility/{facilityId}/resource_category/{slug}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
} as const;
