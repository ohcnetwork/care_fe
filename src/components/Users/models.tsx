import { Gender, UserType } from "@/components/Users/UserFormValidations";

import { GENDER_TYPES } from "@/common/constants";

import { FeatureFlag } from "@/Utils/featureFlags";
import { Organization } from "@/types/organization/organization";

export type UpdatePasswordForm = {
  old_password: string;
  username: string;
  new_password: string;
};

export type UserBareMinimum = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserType;
  last_login: string | undefined;
  read_profile_picture_url?: string;
  external_id: string;
};

export type UserFacilityModel = {
  id: string;
  name: string;
};

export type UserModel = UserBareMinimum & {
  external_id: string;
  local_body?: number;
  district?: number;
  state?: number;
  video_connect_link: string;
  phone_number?: string;
  alt_phone_number?: string;
  gender?: Gender;
  read_profile_picture_url?: string;
  date_of_birth: Date | null | string;
  is_superuser?: boolean;
  verified?: boolean;
  home_facility?: string;
  qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
  weekly_working_hours?: string | null;
  user_flags?: FeatureFlag[];
  facilities?: UserFacilityModel[];
  organizations?: Organization[];
  permissions: string[];
};

export interface UserAssignedModel extends UserBareMinimum {
  local_body?: number;
  district?: number;
  state?: number;
  phone_number?: string;
  alt_phone_number?: string;
  video_connect_link: string;
  gender?: (typeof GENDER_TYPES)[number]["id"];
  date_of_birth: Date | null;
  is_superuser?: boolean;
  verified?: boolean;
  home_facility?: string;
  qualification?: string;
  doctor_experience_commenced_on?: Date;
  doctor_medical_council_registration?: string;
  weekly_working_hours?: string;
}
