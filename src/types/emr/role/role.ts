import { Permission } from "@/types/emr/permission/permission";

export enum RoleContext {
  FACILITY = "FACILITY",
  GOVT_ORG = "GOVT_ORG",
  ROLE_ORG = "ROLE_ORG",
}

export const DEFAULT_ROLE_CONTEXTS = [
  RoleContext.FACILITY,
  RoleContext.GOVT_ORG,
];

export const getRoleContextForOrganizationType = (orgType?: string) => {
  if (!orgType) return undefined;
  if (orgType === "role") return RoleContext.ROLE_ORG;
  if (orgType === "team") return RoleContext.FACILITY;
  return RoleContext.GOVT_ORG;
};

export const getRoleContextLabelKey = (context: RoleContext) =>
  `role_context__${context.toLowerCase()}`;

export interface RoleBase {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  contexts: RoleContext[];
}

export interface RoleRead extends RoleBase {
  permissions: Permission[];
}

export interface RoleCreate extends Omit<RoleBase, "id" | "is_system"> {
  permissions: string[];
}
