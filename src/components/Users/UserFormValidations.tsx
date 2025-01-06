import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

export type UserType = "doctor" | "nurse" | "staff" | "volunteer";

export type Gender = "male" | "female" | "non_binary" | "transgender";

export type UserForm = {
  user_type?: UserType;
  gender: Gender;
  password?: string;
  c_password?: string;
  geo_organization?: string;
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

export const newUserFields: Array<keyof UserForm> = [
  "user_type",
  "username",
  "password",
  "c_password",
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "gender",
  "geo_organization",
];

export const editUserFields: Array<keyof UserForm> = [
  "first_name",
  "last_name",
  "gender",
  "email",
  "phone_number",
];

export const editBasicInfoFields: Array<keyof UserForm> = [
  "first_name",
  "last_name",
  "gender",
];

export const editContactInfoFields: Array<keyof UserForm> = [
  "email",
  "phone_number",
];

export const validateRule = (
  isConditionMet: boolean,
  initialMessage: JSX.Element | string,
  isInitialRender: boolean = false,
  successMessage: JSX.Element | string,
) => {
  return (
    <div>
      {isInitialRender ? (
        <CareIcon icon="l-circle" className="text-sm text-gray-500" />
      ) : isConditionMet ? (
        <CareIcon icon="l-check-circle" className="text-sm text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-sm text-red-500" />
      )}{" "}
      <span
        className={classNames(
          isInitialRender
            ? "text-black text-sm"
            : isConditionMet
              ? "text-primary-500 text-sm"
              : "text-red-500 text-sm",
        )}
      >
        {isInitialRender
          ? initialMessage
          : isConditionMet
            ? successMessage
            : initialMessage}
      </span>
    </div>
  );
};
