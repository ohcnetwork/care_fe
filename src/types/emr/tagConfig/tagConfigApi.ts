import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  TagConfig,
  TagConfigRead,
  TagConfigRequest,
  TagResource,
} from "./tagConfig";

// Tag Config Filters
export type TagConfigFilters = {
  resource?: TagResource;
  parent_is_null?: boolean;
  parent?: string; // UUID of parent tag
  search?: string;
};

export default {
  list: {
    path: "/api/v1/tag_config/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TagConfig>>(),
  },

  create: {
    path: "/api/v1/tag_config/",
    method: HttpMethod.POST,
    TRes: Type<TagConfigRead>(),
    TBody: Type<TagConfigRequest>(),
  },

  retrieve: {
    path: "/api/v1/tag_config/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<TagConfigRead>(),
  },

  update: {
    path: "/api/v1/tag_config/{external_id}/",
    method: HttpMethod.PUT,
    TRes: Type<TagConfigRead>(),
    TBody: Type<TagConfigRequest>(),
  },
} as const;
