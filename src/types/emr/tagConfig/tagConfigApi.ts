import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { TagConfig, TagConfigRequest, TagConfigResponse } from "./tagConfig";

export default {
  list: {
    path: "/api/v1/tag_config/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TagConfig>>(),
  },

  create: {
    path: "/api/v1/tag_config/",
    method: HttpMethod.POST,
    TRes: Type<TagConfigResponse>(),
    TBody: Type<TagConfigRequest>(),
  },

  retrieve: {
    path: "/api/v1/tag_config/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<TagConfig>(),
  },

  update: {
    path: "/api/v1/tag_config/{external_id}/",
    method: HttpMethod.PUT,
    TRes: Type<TagConfigResponse>(),
    TBody: Type<TagConfigRequest>(),
  },
} as const;
