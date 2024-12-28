import { ORGANISATION_LEVELS } from "@/common/constants";

import { PaginatedResponse } from "@/Utils/request/types";

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

export type OrganizationResponse = PaginatedResponse<Organization>;
export type OrganizationUserRoleResponse =
  PaginatedResponse<OrganizationUserRole>;
export type RoleResponse = PaginatedResponse<Role>;

export const getOrgLevel = (org_type: org_type, level_cache: number) => {
  if (org_type === "govt") {
    return ORGANISATION_LEVELS.govt[level_cache];
  } else {
    return ORGANISATION_LEVELS[org_type];
  }
};
