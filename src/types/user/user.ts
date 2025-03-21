import { UserType } from "@/components/Users/UserFormValidations";

import { GENDER_TYPES } from "@/common/constants";

export type UserBase = {
  id: string;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  user_type: UserType;
  last_login: string;
  profile_picture_url: string;
  phone_number: string;
  gender: (typeof GENDER_TYPES)[number]["id"];
  suffix: string | null;
  prefix: string | null;
  mfa_enabled: boolean;
};

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
