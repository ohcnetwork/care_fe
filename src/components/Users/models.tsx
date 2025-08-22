import { Gender } from "@/components/Users/UserFormValidations";

import { Organization } from "@/types/organization/organization";
import { UserType } from "@/types/user/user";

export type UpdatePasswordForm = {
  old_password: string;
  username: string;
  new_password: string;
};

export type UserBareMinimum = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserType;
  last_login: string | undefined;
  profile_picture_url?: string;
  prefix: string | null;
  suffix: string | null;
};

export type UserFacilityModel = {
  id: string;
  name: string;
};

export type AuthUserModel = UserBareMinimum & {
  phone_number?: string;
  alt_phone_number?: string;
  gender?: Gender;
  date_of_birth: Date | null | string;
  is_superuser?: boolean;
  verified?: boolean;
  facilities?: UserFacilityModel[];
  organizations?: Organization[];
  permissions: string[];
  mfa_enabled?: boolean;
  deleted: boolean;
};
