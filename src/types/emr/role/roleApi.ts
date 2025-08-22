import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { RoleCreate, RoleRead } from "./role";

export default {
  listRoles: {
    path: "/api/v1/role/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<RoleRead>>(),
  },
  createRole: {
    path: "/api/v1/role/",
    method: HttpMethod.POST,
    TReq: Type<RoleCreate>(),
    TRes: Type<RoleRead>(),
  },
  getRole: {
    path: "/api/v1/role/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<RoleRead>(),
  },
  updateRole: {
    path: "/api/v1/role/{external_id}/",
    method: HttpMethod.PUT,
    TReq: Type<RoleCreate>(),
    TRes: Type<RoleRead>(),
  },
  deleteRole: {
    path: "/api/v1/role/{external_id}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
};
