import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Patient } from "../emr/newPatient";
import { Organization, OrganizationUserRole } from "./organization";

export default {
  listMine: {
    path: "/api/v1/organization/mine/",
    method: HttpMethod.GET,
    TRes: {} as PaginatedResponse<Organization>,
  },
  list: {
    path: "/api/v1/organization/",
    method: HttpMethod.GET,
    TRes: {} as PaginatedResponse<Organization>,
  },
  get: {
    path: "/api/v1/organization/{id}/",
    method: HttpMethod.GET,
    TRes: {} as Organization,
  },
  listUsers: {
    path: "/api/v1/organization/{id}/users/",
    method: HttpMethod.GET,
    TRes: {} as PaginatedResponse<OrganizationUserRole>,
  },
  assignUser: {
    path: "/api/v1/organization/{id}/users/",
    method: HttpMethod.POST,
    TRes: {} as OrganizationUserRole,
    TBody: {} as { user: string; role: string },
  },
  updateUserRole: {
    path: "/api/v1/organization/{id}/users/{userRoleId}/",
    method: HttpMethod.PUT,
    TRes: {} as OrganizationUserRole,
    TBody: {} as { user: string; role: string },
  },
  removeUserRole: {
    path: "/api/v1/organization/{id}/users/{userRoleId}/",
    method: HttpMethod.DELETE,
    TRes: {} as Record<string, never>,
  },
  listPatients: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Patient>>(),
  },
  getPublicOrganizations: {
    path: "/api/v1/govt/organization/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
};
