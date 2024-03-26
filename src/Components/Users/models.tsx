import { UserRole } from "../../Common/constants";
import { DistrictModel, LocalBodyModel, StateModel } from "../Facility/models";

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
  date_of_birth: Date | null | string;
  is_superuser?: boolean;
  verified?: boolean;
  home_facility?: string;
  home_facility_object?: HomeFacilityObjectModel;
  local_body_object?: LocalBodyModel;
  district_object?: DistrictModel;
  state_object?: StateModel;
  doctor_qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
  weekly_working_hours?: string | null;
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
  gender?: number;
  date_of_birth: Date | null;
  is_superuser?: boolean;
  verified?: boolean;
  home_facility?: string;
  home_facility_object?: HomeFacilityObjectModel;
  doctor_qualification?: string;
  doctor_experience_commenced_on?: Date;
  doctor_medical_council_registration?: string;
  weekly_working_hours?: string;
  skills: SkillObjectModel[];
}
