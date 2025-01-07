import { t } from "i18next";

import { PaginatedResponse } from "@/Utils/request/types";

import { UserBase } from "../user/user";

type org_type = "team" | "govt" | "role" | "other";

export type Metadata = {
  govt_org_children_type?: string;
  govt_org_type?: string;
};

export interface OrganizationParent {
  id: string;
  name: string;
  description?: string;
  metadata: Metadata | null;
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
  metadata: Metadata | null;
  permissions: string[];
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

export const getOrgLabel = (org_type: org_type, metadata: Metadata | null) => {
  if (org_type === "govt") {
    return metadata?.govt_org_type
      ? t(`SYSTEM__govt_org_type__${metadata?.govt_org_type}`)
      : t(`SYSTEM__org_type__${org_type}`);
  }
  return org_type;
};
