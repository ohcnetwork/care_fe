import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { PublicUserRead } from "@/types/user/user";

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
    TRes: Type<PaginatedResponse<PublicUserRead>>(),
  },
  getSchedulableUser: {
    path: "/api/v1/facility/{facilityId}/schedulable_users/{userId}/",
    method: HttpMethod.GET,
    TRes: Type<PublicUserRead>(),
  },
} as const;
