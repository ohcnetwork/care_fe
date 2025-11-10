import { PermissionType } from "@/common/Permissions";

export interface Permission {
  name: string;
  slug: string;
  context: string;
  description: string;
}

export interface Permissions {
  permissions: PermissionType[];
}

export interface FacilityPermissions extends Permissions {
  root_org_permissions: PermissionType[];
  child_org_permissions: PermissionType[];
}
