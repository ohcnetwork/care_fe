import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  ActionConfigurationCreate,
  ActionConfigurationRead,
  ActionConfigurationRetrieve,
  ActionConfigurationUpdate,
} from "./actionConfiguration";

export default {
  list: {
    path: "/api/v1/action_configuration/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ActionConfigurationRead>>(),
  },
  retrieve: {
    path: "/api/v1/action_configuration/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ActionConfigurationRetrieve>(),
  },
  create: {
    path: "/api/v1/action_configuration/",
    method: HttpMethod.POST,
    TBody: Type<ActionConfigurationCreate>(),
    TRes: Type<ActionConfigurationRead>(),
  },
  update: {
    path: "/api/v1/action_configuration/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<ActionConfigurationUpdate>(),
    TRes: Type<ActionConfigurationRead>(),
  },
  delete: {
    path: "/api/v1/action_configuration/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
  },
} as const;
