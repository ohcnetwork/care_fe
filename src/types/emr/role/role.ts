import { Permission } from "@/types/emr/permission/permission";

export type RoleContext = "facility" | "govt_org" | "role_org";

export interface RoleBase {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  contexts: RoleContext[];
}

export interface RoleReadMinimal {
  id: string;
  name: string;
  contexts: RoleContext[];
}

export interface RoleRead extends RoleBase {
  permissions: Permission[];
}

export interface RoleCreate extends Omit<RoleBase, "id" | "contexts"> {
  permissions: string[];
}
