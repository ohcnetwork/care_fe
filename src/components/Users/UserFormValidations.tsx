import { TFunction } from "i18next";

import { validateNumber } from "@/common/validation";

import { FacilityModel } from "../Facility/models";
import { GenderType } from "./models";

export type UserForm = {
  user_type?: string;
  gender: GenderType;
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

export type EditForm = {
  user_type: string;
  qualification?: string | null;
  doctor_experience_commenced_on?: string | null;
  doctor_medical_council_registration?: string | null;
};

export const ValidateQualification = (
  formData: UserForm | EditForm,
  translator: TFunction,
) => {
  if (
    (formData.user_type === "Doctor" || formData.user_type === "Nurse") &&
    !formData["qualification"]
  ) {
    return translator("field_required");
  }
  return null;
};

export const ValidateDoctorExperienceCommencedOn = (
  formData: UserForm | EditForm,
  translator: TFunction,
) => {
  if (formData.user_type === "Doctor") {
    if (!formData["doctor_experience_commenced_on"]) {
      return translator("field_required");
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
  formData: UserForm | EditForm,
  translator: TFunction,
) => {
  if (
    formData.user_type === "Doctor" &&
    !formData["doctor_medical_council_registration"]
  ) {
    return translator("field_required");
  }
  return null;
};
