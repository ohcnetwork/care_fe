import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  FacilityOrganizationCreate,
  FacilityOrganizationRead,
  FacilityOrganizationUserRole,
} from "@/types/facilityOrganization/facilityOrganization";

export default {
  list: {
    path: "/api/v1/facility/{facilityId}/organizations/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityOrganizationRead>>(),
  },
  listMine: {
    path: "/api/v1/facility/{facilityId}/organizations/mine/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityOrganizationRead>>(),
  },
  get: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityOrganizationRead>(),
  },
  create: {
    path: "/api/v1/facility/{facilityId}/organizations/",
    method: HttpMethod.POST,
    TRes: Type<FacilityOrganizationRead>(),
    TBody: Type<FacilityOrganizationCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/",
    method: HttpMethod.PUT,
    TRes: Type<FacilityOrganizationRead>(),
    TBody: Type<FacilityOrganizationCreate>(),
  },
  delete: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/",
    method: HttpMethod.DELETE,
    TBody: Type<void>(),
    TRes: Type<void>(),
  },
  listUsers: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityOrganizationUserRole>>(),
  },
  assignUser: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/",
    method: HttpMethod.POST,
    TRes: Type<FacilityOrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  updateUserRole: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/{userRoleId}/",
    method: HttpMethod.PUT,
    TRes: Type<FacilityOrganizationUserRole>(),
    TBody: Type<{ role: string }>(),
  },
  removeUserRole: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/{userRoleId}/",
    method: HttpMethod.DELETE,
    TBody: Type<void>(),
    TRes: Type<void>(),
  },
};
