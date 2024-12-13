import { TFunction } from "i18next";

import { validateNumber } from "@/common/validation";

import { FacilityModel } from "../Facility/models";

export type UserForm = {
  user_type?: string;
  gender: string;
  password?: string;
  c_password?: string;
  facilities?: Array<string>;
  home_facility?: FacilityModel | null;
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  phone_number_is_whatsapp?: boolean;
  date_of_birth: Date | null | string;
  state?: number;
  district?: number;
  local_body?: number;
  qualification?: string | undefined;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
  video_connect_link?: string;
  weekly_working_hours?: string | null;
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
  "alt_phone_number",
  "phone_number_is_whatsapp",
  "gender",
  "date_of_birth",
  "state",
  "district",
  "local_body",
  "facilities",
  "home_facility",
  "qualification",
  "doctor_experience_commenced_on",
  "doctor_medical_council_registration",
];

export const editUserFields: Array<keyof UserForm> = [
  "first_name",
  "last_name",
  "date_of_birth",
  "gender",
  "email",
  "video_connect_link",
  "phone_number",
  "alt_phone_number",
  "phone_number_is_whatsapp",
  "qualification",
  "doctor_experience_commenced_on",
  "doctor_medical_council_registration",
  "weekly_working_hours",
];

export const editBasicInfoFields: Array<keyof UserForm> = [
  "first_name",
  "last_name",
  "date_of_birth",
  "gender",
];

export const editContactInfoFields: Array<keyof UserForm> = [
  "email",
  "phone_number",
  "alt_phone_number",
  "phone_number_is_whatsapp",
];

export const editProfessionalInfoFields: Array<keyof UserForm> = [
  "weekly_working_hours",
  "video_connect_link",
];

export const editProfessionalInfoFieldsForNurseDoctor: Array<keyof UserForm> = [
  "qualification",
  "doctor_experience_commenced_on",
  "doctor_medical_council_registration",
  ...editProfessionalInfoFields,
];

export const ValidateQualification = (
  formData: UserForm,
  translator: TFunction,
) => {
  if (
    (formData.user_type === "Doctor" || formData.user_type === "Nurse") &&
    !formData["qualification"]
  ) {
    return translator("qualification_required");
  }
  return null;
};

export const ValidateDoctorExperienceCommencedOn = (
  formData: UserForm,
  translator: TFunction,
) => {
  if (formData.user_type === "Doctor") {
    if (!formData["doctor_experience_commenced_on"]) {
      return translator("doctor_experience_required");
    } else if (
      !validateNumber(formData["doctor_experience_commenced_on"] ?? "") ||
      Number(formData["doctor_experience_commenced_on"]) < 0 ||
      Number(formData["doctor_experience_commenced_on"]) > 100
    ) {
      return translator("doctor_experience_error");
    }
  }
  return null;
};

export const ValidateDoctorMedicalCouncilRegistration = (
  formData: UserForm,
  translator: TFunction,
) => {
  if (
    formData.user_type === "Doctor" &&
    !formData["doctor_medical_council_registration"]
  ) {
    return translator("medical_council_registration_required");
  }
  return null;
};

export const ValidateVideoLink = (
  formData: UserForm,
  translator: TFunction,
) => {
  if (!formData["video_connect_link"]) return null;

  try {
    const parsed = new URL(formData["video_connect_link"]);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      return translator("invalid_url_http_https");
    }
    if (parsed.href.toLowerCase().includes("javascript:")) {
      return translator("invalid_url_javascript");
    }
  } catch {
    return translator("invalid_url");
  }
  return null;
};
