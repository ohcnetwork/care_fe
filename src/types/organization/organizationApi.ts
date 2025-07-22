import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { PatientRead } from "@/types/emr/patient/patient";

import {
  Organization,
  OrganizationCreate,
  OrganizationEdit,
  OrganizationUserRole,
} from "./organization";

export default {
  listMine: {
    path: "/api/v1/organization/mine/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  list: {
    path: "/api/v1/organization/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  create: {
    path: "/api/v1/organization/",
    method: HttpMethod.POST,
    TRes: Type<Organization>(),
    TBody: Type<OrganizationCreate>(),
  },
  update: {
    path: "/api/v1/organization/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<Organization>(),
    TBody: Type<OrganizationEdit>(),
  },
  delete: {
    path: "/api/v1/organization/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  get: {
    path: "/api/v1/organization/{id}/",
    method: HttpMethod.GET,
    TRes: Type<Organization>(),
  },
  listUsers: {
    path: "/api/v1/organization/{id}/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<OrganizationUserRole>>(),
  },
  assignUser: {
    path: "/api/v1/organization/{id}/users/",
    method: HttpMethod.POST,
    TRes: Type<OrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  updateUserRole: {
    path: "/api/v1/organization/{id}/users/{userRoleId}/",
    method: HttpMethod.PUT,
    TRes: Type<OrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  removeUserRole: {
    path: "/api/v1/organization/{id}/users/{userRoleId}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  listPatients: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PatientRead>>(),
  },
  getPublicOrganizations: {
    path: "/api/v1/govt/organization/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  getPublicOrganization: {
    path: "/api/v1/govt/organization/{id}/",
    method: HttpMethod.GET,
    TRes: Type<Organization>(),
  },
};
