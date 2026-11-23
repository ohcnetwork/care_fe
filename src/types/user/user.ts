import { GENDER_TYPES } from "@/common/constants";

import { Permissions } from "@/types/emr/permission/permission";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";

export type UserType =
  "doctor" | "nurse" | "staff" | "volunteer" | "administrator";

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

export interface UserBaseSpec {
  id?: string | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  prefix?: string | null;
  suffix?: string | null;
}

export interface UserSpec extends UserBaseSpec {
  last_login: string;
  profile_picture_url: string;
  gender: (typeof GENDER_TYPES)[number]["id"];
  username: string;
  mfa_enabled: boolean;
  phone_number: string;
  deleted: boolean;
  role_orgs?: Array<{
    id: string;
    organization: Organization;
    role: {
      id: string;
      name: string;
      description: string;
      is_system: boolean;
    };
  }>;
  communication: UserCommunication[];
  qualification: UserQualification[];
}

export interface UserRetrieveSpec extends UserSpec {
  geo_organization?: Organization;
  created_by?: UserSpec;
  email: string;
  flags: string[];
  is_service_account: boolean;
}

export interface CurrentUserRetrieveSpec extends UserRetrieveSpec, Permissions {
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

// Todo: Once backend adds a proper public user read spec, add it here and update the usages where applicable

export interface UserUpdateSpec extends UserBaseSpec {
  gender: (typeof GENDER_TYPES)[number]["id"];
  phone_number: string;
  geo_organization?: string;
  communication?: UserCommunication[];
  qualification?: UserQualification[];
}

export interface UserCreateSpec extends UserUpdateSpec {
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
