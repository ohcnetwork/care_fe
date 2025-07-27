import { GENDER_TYPES } from "@/common/constants";

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
}

export interface UserRead extends UserReadMinimal {
  geo_organization: Organization;
  created_by: UserReadMinimal;
  email: string;
  flags: string[];
}

// Todo: Once backend adds a proper public user read spec, add it here and update the usages where applicable

export interface UserUpdate extends Omit<UserBase, "id"> {
  geo_organization?: string;
}

export interface UserCreate extends UserUpdate {
  password?: string;
  email: string;
}
