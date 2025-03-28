import { t } from "i18next";

import {
  AssignedToObjectModel,
  PatientMeta,
} from "@/components/Patient/models";
import { UserBareMinimum } from "@/components/Users/models";

import { RATION_CARD_CATEGORY } from "@/common/constants";

export interface PatientModel {
  id?: string;
  action?: number;
  name?: string;
  allow_transfer?: boolean;
  discharge?: boolean;
  gender?: string;
  created_date?: string;
  modified_date?: string;
  facility?: string;
  geo_organization?: string;
  phone_number?: string;
  emergency_phone_number?: string;
  allergies?: string;
  medical_history?: Array<{ disease: string | number; details: string }>;
  facility_object?: {
    id: number;
    name: string;
    facility_type?: { id: number; name: string };
  };
  contact_with_carrier?: boolean;
  medical_history_details?: string;
  is_active?: boolean;
  is_antenatal?: boolean;
  last_menstruation_start_date?: string;
  date_of_delivery?: string;
  is_migrant_worker?: boolean;
  ward?: string;
  local_body_object?: { id: number; name: string };
  ward_object?: { id: number; name: string; number: number };
  district_object?: { id: number; name: string };
  state_object?: { id: number; name: string };
  tele_consultation_history?: Array<any>;
  address?: string;
  permanent_address?: string;
  sameAddress?: boolean;
  village?: string;
  pincode?: number;
  is_medical_worker?: boolean;
  designation_of_health_care_worker?: string;
  instituion_of_health_care_worker?: string;
  frontline_worker?: string;
  past_travel?: boolean;
  ongoing_medication?: string;
  countries_travelled?: Array<string>;
  transit_details?: string;
  present_health?: string;
  has_SARI?: boolean;
  nationality?: string;
  passport_no?: string;
  ration_card_category?: (typeof RATION_CARD_CATEGORY)[number] | null;
  date_of_test?: string;
  date_of_result?: string; // keeping this to avoid errors in Death report
  covin_id?: string;
  is_vaccinated?: boolean;
  vaccine_name?: string;
  number_of_doses?: number;
  last_vaccinated_date?: string;
  date_of_birth?: string;
  year_of_birth?: number;
  deceased_datetime?: string;
  blood_group?: string;
  review_interval?: number;
  review_time?: string;
  date_of_return?: string;
  number_of_aged_dependents?: number;
  number_of_chronic_diseased_dependents?: number;
  will_donate_blood?: boolean;
  fit_for_blood_donation?: boolean;
  date_declared_positive?: string;
  is_declared_positive?: boolean;
  last_edited?: UserBareMinimum;
  created_by?: UserBareMinimum;
  assigned_to?: number | null;
  assigned_to_object?: AssignedToObjectModel;
  meta_info?: PatientMeta;
}

export const validatePatient = (patient: PatientModel, useDob: boolean) => {
  const errors: Record<string, string[]> = {};
  const requiredFields: Array<keyof PatientModel> = [
    "name",
    "phone_number",
    "emergency_phone_number",
    "gender",
    "blood_group",
    useDob ? "date_of_birth" : "year_of_birth",
    "pincode",
    "nationality",
    "address",
    "permanent_address",
  ];

  if (patient.nationality === "India") {
    requiredFields.push("geo_organization");
  }

  requiredFields.forEach((field) => {
    if (!patient[field]) {
      errors[field] = errors[field] || [];
      errors[field].push(`This field is required`);
    } else if (
      useDob &&
      field === "date_of_birth" &&
      !/^(19[0-9]{2}|20[0-9]{2}|2100)-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/.test(
        patient[field],
      )
    ) {
      errors[field] = errors[field] || [];
      errors[field].push(t("invalid_date_format", { format: "DD-MM-YYYY" }));
    } else if (
      (field === "phone_number" || field === "emergency_phone_number") &&
      patient[field]?.length < 13
    ) {
      errors[field] = errors[field] || [];
      errors[field].push(t("phone_number_min_error"));
    }
  });

  if (Object.keys(errors).length > 0) {
    return errors;
  } else {
    return true;
  }
};
