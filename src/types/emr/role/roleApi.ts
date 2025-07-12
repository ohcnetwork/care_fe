import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Role } from "./role";

export default {
  listRoles: {
    path: "/api/v1/role/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Role>>(),
  },
  createRole: {
    path: "/api/v1/role/",
    method: HttpMethod.POST,
    TReq: Type<Omit<Role, "id">>(),
    TRes: Type<Role>(),
  },
  getRole: {
    path: "/api/v1/role/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<Role>(),
  },
  updateRole: {
    path: "/api/v1/role/{external_id}/",
    method: HttpMethod.PUT,
    TReq: Type<Omit<Role, "id">>(),
    TRes: Type<Role>(),
  },
  deleteRole: {
    path: "/api/v1/role/{external_id}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
};
