import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  FacilityOrganization,
  FacilityOrganizationCreate,
  FacilityOrganizationEdit,
  FacilityOrganizationResponse,
} from "@/types/facilityOrganization/facilityOrganization";
import { OrganizationUserRole } from "@/types/organization/organization";

export default {
  list: {
    path: "/api/v1/facility/{facilityId}/organizations/",
    method: HttpMethod.GET,
    TRes: Type<FacilityOrganizationResponse>(),
  },
  listMine: {
    path: "/api/v1/facility/{facilityId}/organizations/mine/",
    method: HttpMethod.GET,
    TRes: Type<FacilityOrganizationResponse>(),
  },
  get: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityOrganization>(),
  },
  create: {
    path: "/api/v1/facility/{facilityId}/organizations/",
    method: HttpMethod.POST,
    TRes: Type<FacilityOrganization>(),
    TBody: Type<FacilityOrganizationCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/",
    method: HttpMethod.PUT,
    TRes: Type<FacilityOrganization>(),
    TBody: Type<FacilityOrganizationEdit>(),
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
    TRes: Type<PaginatedResponse<OrganizationUserRole>>(),
  },
  assignUser: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/",
    method: HttpMethod.POST,
    TRes: Type<OrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  updateUserRole: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/{userRoleId}/",
    method: HttpMethod.PUT,
    TRes: Type<OrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  removeUserRole: {
    path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/users/{userRoleId}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
  },
};
