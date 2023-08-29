import { UserRole } from "../../Common/constants";
import { DistrictModel, LocalBodyModel, StateModel } from "../Facility/models";

interface HomeFacilityObjectModel {
  id?: string;
  name?: string;
}
export type UserModel = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserRole;
  local_body?: number;
  district?: number;
  state?: number;
  phone_number?: string;
  alt_phone_number?: string;
  gender?: number;
  age?: number;
  is_superuser?: boolean;
  verified?: boolean;
  last_login: string | undefined;
  home_facility_object?: HomeFacilityObjectModel;
  local_body_object?: LocalBodyModel;
  district_object?: DistrictModel;
  state_object?: StateModel;
  doctor_qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
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

export interface UserAssignedModel {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_type?: number | string;
  local_body?: number;
  district?: number;
  state?: number;
  phone_number?: string;
  alt_phone_number?: string;
  gender?: number;
  age?: number;
  is_superuser?: boolean;
  verified?: boolean;
  last_login?: Date;
  home_facility_object?: HomeFacilityObjectModel;
  doctor_qualification?: string;
  doctor_experience_commenced_on?: Date;
  doctor_medical_council_registration?: string;
  skills: SkillObjectModel[];
}
