import { Permission } from "@/types/emr/permission/permission";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}
