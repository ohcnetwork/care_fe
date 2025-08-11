import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { UserReadMinimal } from "@/types/user/user";

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
  listFacilitySchedulableUsers: {
    path: "/api/v1/facility/{facilityId}/schedulable_users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },
  getFacilitySchedulableUser: {
    path: "/api/v1/facility/{facilityId}/schedulable_users/{userId}/",
    method: HttpMethod.GET,
    TRes: Type<UserReadMinimal>(),
  },
} as const;
