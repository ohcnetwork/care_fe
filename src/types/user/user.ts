import { GENDER_TYPES } from "@/common/constants";

import { Permissions } from "@/types/emr/permission/permission";
import { RoleBase } from "@/types/emr/role/role";
import { FacilityBareMinimum } from "@/types/facility/facility";
import {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const USER_LANGUAGE_SYSTEM = "urn:iso:std:iso:639:-3" as const;

export interface UserCommunication {
  language: { code: string; system: typeof USER_LANGUAGE_SYSTEM };
  preferred: boolean;
  proficiency?: (typeof CEFR_LEVELS)[number] | null;
}

export interface UserQualification {
  registration_number: string;
  issuer: string;
  degree: { code: string; system: string };
  meta: Record<string, unknown>;
}

export interface UserQualificationDegree {
  code: string;
  system: string;
  display?: string | null;
}

// The backend sends a smaller organization here, and the full Organization
// type makes form types too deep for TypeScript.
export interface UserRoleOrg {
  id: string;
  organization: OrganizationParent;
  role: Pick<RoleBase, "id" | "name" | "description" | "is_system">;
}

export interface UserBase {
  first_name: string;
  last_name: string;
  phone_number: string;
  prefix?: string | null;
  suffix?: string | null;
}

export interface UserReadMinimal extends UserBase {
  id: string;
  last_login: string;
  profile_picture_url: string;
  gender: (typeof GENDER_TYPES)[number]["id"];
  username: string;
  mfa_enabled: boolean;
  deleted: boolean;
  role_orgs?: UserRoleOrg[];
  communication: UserCommunication[];
  qualification: UserQualification[];
}

export interface UserRead extends UserReadMinimal {
  geo_organization?: Organization;
  created_by?: UserReadMinimal;
  email: string;
  flags: string[];
  is_service_account: boolean;
}

export interface CurrentUserRead extends UserRead, Permissions {
  alt_phone_number?: string;
  date_of_birth?: string;
  is_superuser: boolean;
  facilities: FacilityBareMinimum[];
  organizations: Organization[];
  pf_endpoint: string | null;
  pf_p256dh: string | null;
  pf_auth: string | null;
  preferences: Record<string, unknown>;
}

// Returned by the public schedulable users APIs.
export type PublicUserRead = Omit<
  UserReadMinimal,
  "mfa_enabled" | "deleted" | "communication" | "qualification"
>;

export interface UserUpdate extends UserBase {
  gender: (typeof GENDER_TYPES)[number]["id"];
  geo_organization?: string;
  communication?: UserCommunication[];
  qualification?: UserQualification[];
}

export interface UserCreate extends UserUpdate {
  username: string;
  password?: string;
  email: string;
  is_service_account?: boolean;
  role_orgs: Array<{ organization: string; role: string }>;
}

export interface GetServiceAccountsResponse {
  external_id: string;
  username: string;
}

export interface GenerateServiceAccountTokenResponse {
  token: string;
  user: string;
  created: string;
}
