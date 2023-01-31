interface HomeFacilityObjectModel {
  id?: string;
  name?: string;
}
export interface UserModel {
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
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
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
}
