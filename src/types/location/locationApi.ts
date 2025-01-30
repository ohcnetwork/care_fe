import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { LocationDetail, LocationList, LocationWrite } from "./location";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/location/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<LocationList>>(),
  },
  get: {
    path: "/api/v1/facility/{facility_id}/location/{id}",
    method: HttpMethod.GET,
    TRes: Type<LocationDetail>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/location/",
    method: HttpMethod.POST,
    TRes: Type<LocationDetail>(),
    TBody: Type<LocationWrite>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/location/{id}",
    method: HttpMethod.PUT,
    TRes: Type<LocationDetail>(),
    TBody: Type<LocationWrite>(),
  },
};
