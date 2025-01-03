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
};
