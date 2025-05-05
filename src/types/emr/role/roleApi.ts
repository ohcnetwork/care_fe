import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Role } from "./role";

export default {
  listRoles: {
    path: "/api/v1/role/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Role>>(),
  },
};
