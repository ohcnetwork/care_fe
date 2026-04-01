import { GENDER_TYPES } from "@/common/constants";

import { Permissions } from "@/types/emr/permission/permission";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";

export type UserType =
  | "doctor"
  | "nurse"
  | "staff"
  | "volunteer"
  | "administrator";

export interface UserBase {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  prefix?: string | null;
  suffix?: string | null;
  user_type: UserType;
  gender: (typeof GENDER_TYPES)[number]["id"];
}

export interface UserReadMinimal extends UserBase {
  last_login: string;
  profile_picture_url: string;
  mfa_enabled: boolean;
  deleted: boolean;
  is_service_account: boolean;
}

export interface UserRead extends UserReadMinimal {
  geo_organization?: Organization;
  created_by?: UserReadMinimal;
  email: string;
  flags: string[];
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
}

export interface CurrentUserRead extends UserRead, Permissions {
  alt_phone_number?: string;
  date_of_birth?: string;
  is_superuser: boolean;
  qualification: string | null;
  doctor_experience_commenced_on: string | null;
  doctor_medical_council_registration: string | null;
  weekly_working_hours: string | null;
  verified: boolean;
  facilities: FacilityBareMinimum[];
  organizations: Organization[];
  last_login: string;
  pf_endpoint: string | null;
  pf_p256dh: string | null;
  pf_auth: string | null;
  preferences: Record<string, unknown>;
}

// Todo: Once backend adds a proper public user read spec, add it here and update the usages where applicable

export interface UserUpdate {
  first_name: string;
  last_name: string;
  phone_number: string;
  prefix?: string | null;
  suffix?: string | null;
  gender: (typeof GENDER_TYPES)[number]["id"];
  geo_organization?: string;
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
