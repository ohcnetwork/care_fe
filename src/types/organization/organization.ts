import { t } from "i18next";

import { RoleRead } from "@/types/emr/role/role";
import { UserReadMinimal } from "@/types/user/user";

type org_type =
  | "team"
  | "govt"
  | "role"
  | "product_supplier"
  | "other"
  | "product_supplier";

export enum OrgType {
  TEAM = "team",
  GOVT = "govt",
  ROLE = "role",
  PRODUCT_SUPPLIER = "product_supplier",
  OTHER = "other",
}

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

export interface OrganizationUpdate {
  name?: string;
  description?: string;
  org_type?: OrgType;
  parent_id?: string;
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

export interface OrganizationCreate {
  name: string;
  description?: string;
  org_type: OrgType;
  parent_id?: string;
}

export interface OrganizationUserRole {
  id: string;
  user: UserReadMinimal;
  role: RoleRead;
}

export const getOrgLabel = (org_type: org_type, metadata: Metadata | null) => {
  if (org_type === "govt") {
    return metadata?.govt_org_type
      ? t(`SYSTEM__govt_org_type__${metadata?.govt_org_type}`)
      : t(`SYSTEM__org_type__${org_type}`);
  }
  return org_type;
};

export const renderGeoOrganizations = (geoOrg: Organization) => {
  const orgParents: OrganizationParent[] = [];

  let currentParent = geoOrg.parent;

  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  const formatValue = (name: string, label: string) => {
    return name.endsWith(label)
      ? name.replace(new RegExp(`${label}$`), "").trim()
      : name;
  };

  const parentDetails = orgParents.map((org) => {
    const label = getOrgLabel(org.org_type, org.metadata);
    return {
      label,
      value: formatValue(org.name, label),
    };
  });

  const geoOrgLabel = getOrgLabel(geoOrg.org_type, geoOrg.metadata);

  return [
    {
      label: geoOrgLabel,
      value: formatValue(geoOrg.name, geoOrgLabel),
    },
  ].concat(parentDetails);
};
