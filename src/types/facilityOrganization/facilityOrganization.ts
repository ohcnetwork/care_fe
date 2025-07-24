import { PaginatedResponse } from "@/Utils/request/types";
import { UserReadBase } from "@/types/user/user";

export type OrgType = "root" | "dept" | "team";

export interface FacilityOrganizationParent {
  id: string;
  name: string;
  description?: string;
  org_type: OrgType;
  level_cache: number;
  parent?: FacilityOrganizationParent;
}

export interface FacilityOrganizationBase {
  name: string;
  description: string;
  org_type: OrgType;
  active: boolean;
}

export interface FacilityOrganizationRead extends FacilityOrganizationBase {
  id: string;
  parent?: FacilityOrganizationParent;
  level_cache: number;
  has_children: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityOrganizationCreate extends FacilityOrganizationBase {
  facility: string;
  parent?: string;
}

export interface FacilityOrganizationUserRole {
  id: string;
  user: UserReadBase;
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

export type FacilityOrganizationUserRoleResponse =
  PaginatedResponse<FacilityOrganizationUserRole>;
export type RoleResponse = PaginatedResponse<Role>;
