import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Permission } from "./permission";

export default {
  listPermissions: {
    path: "/api/v1/permission/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Permission>>(),
  },
  getPermission: {
    path: "/api/v1/permission/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<Permission>(),
  },
};
