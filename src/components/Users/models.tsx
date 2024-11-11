import {
  DistrictModel,
  LocalBodyModel,
  StateModel,
} from "@/components/Facility/models";

import { GENDER_TYPES, UserRole } from "@/common/constants";

import { FeatureFlag } from "@/Utils/featureFlags";

interface HomeFacilityObjectModel {
  id?: string;
  name?: string;
}

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
  user_type: UserRole;
  last_login: string | undefined;
  read_profile_picture_url?: string;
};

export type GenderType = "Male" | "Female" | "Transgender";

export type UserModel = UserBareMinimum & {
  local_body?: number;
  district?: number;
  state?: number;
  video_connect_link: string;
  phone_number?: string;
  alt_phone_number?: string;
  gender?: GenderType;
  read_profile_picture_url?: string;
  date_of_birth: Date | null | string;
  is_superuser?: boolean;
  verified?: boolean;
  home_facility?: string;
  home_facility_object?: HomeFacilityObjectModel;
  local_body_object?: LocalBodyModel;
  district_object?: DistrictModel;
  state_object?: StateModel;
  qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
  weekly_working_hours?: string | null;
  user_flags?: FeatureFlag[];
};

export type UserBaseModel = {
  email: string;
  first_name: string;
  last_name: string;
  id: number;
  user_type: UserRole;
  username: string;
  last_login: string | undefined;
};

export interface SkillObjectModel {
  id: string;
  name: string;
  description?: string;
}

export interface SkillModel {
  id: string;
  skill_object: SkillObjectModel;
}

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
  home_facility_object?: HomeFacilityObjectModel;
  qualification?: string;
  doctor_experience_commenced_on?: Date;
  doctor_medical_council_registration?: string;
  weekly_working_hours?: string;
  skills: SkillObjectModel[];
}
