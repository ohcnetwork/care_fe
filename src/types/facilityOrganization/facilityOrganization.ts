import { RoleRead } from "@/types/emr/role/role";
import { UserReadMinimal } from "@/types/user/user";

export enum FacilityOrganizationType {
  ROOT = "root",
  DEPT = "dept",
  TEAM = "team",
}

export interface FacilityOrganizationParent {
  id: string;
  name: string;
  description?: string;
  org_type: FacilityOrganizationType;
  level_cache: number;
  parent?: FacilityOrganizationParent;
}

export interface FacilityOrganizationBase {
  name: string;
  description: string;
  org_type: FacilityOrganizationType;
}

export interface FacilityOrganizationRead extends FacilityOrganizationBase {
  id: string;
  parent?: FacilityOrganizationParent;
  active: boolean;
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
  user: UserReadMinimal;
  role: RoleRead;
}
