import { Organization } from "@/types/organization/organization";
import { UserReadMinimal } from "@/types/user/user";

export const WORKSPACE_AUTH_CONTEXTS = [
  "instance",
  "facility",
  "facility_organization",
  "user",
] as const;

export type WorkspaceAuthContext = (typeof WORKSPACE_AUTH_CONTEXTS)[number];

export type WorkspaceAdminScope = Extract<
  WorkspaceAuthContext,
  "instance" | "facility"
>;

export type WorkspaceScope =
  | {
      authContext: "instance";
      basePath: string;
      facilityId?: never;
    }
  | {
      authContext: "facility";
      basePath: string;
      facilityId: string;
    };

export const INSTANCE_WORKSPACE_SCOPE: WorkspaceScope = {
  authContext: "instance",
  basePath: "/admin/workspaces",
};

export function workspaceScopeForFacility(facilityId: string): WorkspaceScope {
  return {
    authContext: "facility",
    facilityId,
    basePath: `/facility/${facilityId}/settings/workspaces`,
  };
}

/** The backend accepts an arbitrary JSON object without prescribing its keys. */
export type WorkspaceTemplate = Record<string, unknown>;

export interface WorkspaceBase {
  name: string;
  description: string;
  template: WorkspaceTemplate;
}

export interface WorkspaceMinimalRead extends WorkspaceBase {
  id: string;
}

export interface WorkspaceRead extends WorkspaceMinimalRead {
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}

export interface WorkspaceCreate extends WorkspaceBase {
  auth_context: WorkspaceAuthContext;
  inherited: false;
  /** Required for facility and user workspaces. */
  facility?: string | null;
  /** Required for facility_organization workspaces. */
  facility_organization?: string | null;
}

/** Scope and facility cannot be changed after creation. */
export type WorkspaceUpdate = WorkspaceBase;

export interface WorkspaceFacilityOrganizationsUpdate {
  /** Replaces the entire association list with organizations from this facility. */
  facility_organizations: string[];
}

/** Fields used from the instance workspace's organization access response. */
export interface WorkspaceOrganizationRead extends Pick<
  Organization,
  "id" | "name" | "org_type" | "active" | "level_cache" | "has_children"
> {
  description?: string | null;
}

export interface WorkspaceOrganizationsUpdate {
  /** Replaces the entire association list for an instance workspace. */
  organizations: string[];
}

export interface WorkspaceDefaultAttributesUpdate {
  attribute?: string | null;
  value: string;
}

export interface WorkspaceUserDefaultAttributes {
  attribute: string | null;
  value: string | null;
  workspace: WorkspaceMinimalRead;
}
