export interface UserModal {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  user_type?: number;
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
}
