import { Permission } from "@/types/emr/permission/permission";

export interface RoleBase {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

export interface RoleRead extends RoleBase {
  permissions: Permission[];
}

export interface RoleCreate extends Omit<RoleBase, "id"> {
  permissions: string[];
}
