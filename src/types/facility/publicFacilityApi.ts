import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { UserSpec } from "@/types/user/user";

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
  listSchedulableUsers: {
    path: "/api/v1/facility/{facilityId}/schedulable_users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserSpec>>(),
  },
  getSchedulableUser: {
    path: "/api/v1/facility/{facilityId}/schedulable_users/{userId}/",
    method: HttpMethod.GET,
    TRes: Type<UserSpec>(),
  },
} as const;
