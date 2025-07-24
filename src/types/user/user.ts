import { UserType } from "@/components/Users/UserFormValidations";

import { GENDER_TYPES } from "@/common/constants";

import { Organization } from "@/types/organization/organization";

export interface UserBase {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  prefix?: string | null;
  suffix?: string | null;
}

export interface UserReadBase extends UserBase {
  last_login: string;
  profile_picture_url: string;
  user_type: UserType;
  gender: (typeof GENDER_TYPES)[number]["id"];
  username: string;
  mfa_enabled: boolean;
  deleted: boolean;
}

export interface UserRead extends UserReadBase {
  geo_organization: Organization;
  created_by: UserReadBase;
  email: string;
  flags: string[];
}

export type CreateUserModel = {
  user_type: UserType;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: (typeof GENDER_TYPES)[number]["id"];
  qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
  geo_organization: string;
};

export type UpdateUserModel = Omit<
  CreateUserModel,
  "username" | "password" | "email"
>;
