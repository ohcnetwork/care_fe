import { PaginatedResponse } from "@/Utils/request/types";

type org_type = "root" | "dept" | "team";

export interface FacilityOrganizationParent {
  id: string;
  name: string;
  description?: string;
  org_type: org_type;
  level_cache: number;
  parent?: FacilityOrganizationParent;
}

export interface FacilityOrganization {
  id: string;
  name: string;
  description?: string;
  org_type: org_type;
  level_cache: number;
  has_children: boolean;
  active: boolean;
  parent?: FacilityOrganizationParent;
  created_at: string;
  updated_at: string;
}

export interface FacilityOrganizationCreate {
  name: string;
  description?: string;
  org_type: org_type;
  parent?: string;
}

export interface FacilityOrganizationUserRole {
  id: string;
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    last_login: string;
    profile_picture_url: string;
  };
  role: {
    id: string;
    name: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type FacilityOrganizationResponse =
  PaginatedResponse<FacilityOrganization>;
export type FacilityOrganizationUserRoleResponse =
  PaginatedResponse<FacilityOrganizationUserRole>;
export type RoleResponse = PaginatedResponse<Role>;
