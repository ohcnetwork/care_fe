export interface Permission {
  name: string;
  slug: string;
  context: string;
  description: string;
}

export interface Permissions {
  permissions: string[];
}

export interface FacilityPermissions extends Permissions {
  root_org_permissions: string[];
  child_org_permissions: string[];
}
