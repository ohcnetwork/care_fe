import { ORGANIZATION_LEVELS } from "@/common/constants";

import { PaginatedResponse } from "@/Utils/request/types";

import { UserBase } from "../user/user";

type org_type = "team" | "govt" | "role" | "other";

export interface OrganizationParent {
  id: string;
  name: string;
  description?: string;
  org_type: org_type;
  level_cache: number;
  parent?: OrganizationParent;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  org_type: org_type;
  level_cache: number;
  has_children: boolean;
  active: boolean;
  parent?: OrganizationParent;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUserRole {
  id: string;
  user: UserBase;
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

export type OrganizationUserRoleResponse =
  PaginatedResponse<OrganizationUserRole>;
export type RoleResponse = PaginatedResponse<Role>;

export const getOrgLevel = (org_type: org_type, level_cache: number) => {
  if (org_type === "govt") {
    return ORGANIZATION_LEVELS.govt[level_cache];
  } else {
    return ORGANIZATION_LEVELS[org_type];
  }
};

export const getOrgLevelLabel = (org_type: org_type, level_cache: number) => {
  const orgLevel = getOrgLevel(org_type, level_cache);
  return typeof orgLevel === "string" ? orgLevel : orgLevel[0];
};
