import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

import {
  WorkspaceCreate,
  WorkspaceDefaultAttributesUpdate,
  WorkspaceFacilityOrganizationsUpdate,
  WorkspaceRead,
  WorkspaceUpdate,
  WorkspaceUserDefaultAttributes,
} from "./workspace";

export default {
  /** Filter configuration lists by auth_context and, for a facility, facility. */
  list: {
    path: "/api/v1/workspace/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<WorkspaceRead>>(),
  },
  get: {
    path: "/api/v1/workspace/{id}/",
    method: HttpMethod.GET,
    TRes: Type<WorkspaceRead>(),
  },
  create: {
    path: "/api/v1/workspace/",
    method: HttpMethod.POST,
    TBody: Type<WorkspaceCreate>(),
    TRes: Type<WorkspaceRead>(),
  },
  update: {
    path: "/api/v1/workspace/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<WorkspaceUpdate>(),
    TRes: Type<WorkspaceRead>(),
  },
  delete: {
    path: "/api/v1/workspace/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  /** Facility workspaces only; requires permission to write the workspace. */
  getFacilityOrganizations: {
    path: "/api/v1/workspace/{id}/get_facility_organizations/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityOrganizationRead>>(),
  },
  setFacilityOrganizations: {
    path: "/api/v1/workspace/{id}/set_facility_organizations/",
    method: HttpMethod.POST,
    TBody: Type<WorkspaceFacilityOrganizationsUpdate>(),
    TRes: Type<Record<string, never>>(),
  },
  setDefaultAttributes: {
    path: "/api/v1/workspace/{id}/set_default_attributes/",
    method: HttpMethod.POST,
    TBody: Type<WorkspaceDefaultAttributesUpdate>(),
    TRes: Type<Record<string, never>>(),
  },
  getUserDefaultAttributes: {
    path: "/api/v1/workspace/get_user_default_attributes/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<WorkspaceUserDefaultAttributes>>(),
  },
} as const;
