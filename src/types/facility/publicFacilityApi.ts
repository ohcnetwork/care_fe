import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { FacilityPublicRead } from "./facility";

export default {
  getAll: {
    path: "/api/v1/getallfacilities/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityPublicRead>>(),
  },
  getAny: {
    path: "/api/v1/getallfacilities/{id}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityPublicRead>(),
  },
} as const;
