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
}
