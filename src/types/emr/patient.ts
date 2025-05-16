import { UserBareMinimum } from "@/components/Users/models";

import { Organization } from "@/types/organization/organization";

export type BloodGroupChoices =
  | "A_negative"
  | "A_positive"
  | "B_negative"
  | "B_positive"
  | "AB_negative"
  | "AB_positive"
  | "O_negative"
  | "O_positive"
  | "unknown";

export const BLOOD_GROUP_STYLES = {
  A_positive: "bg-red-100 text-red-800 border-red-200",
  A_negative: "bg-red-50 text-red-700 border-red-100",
  B_positive: "bg-yellow-100 text-yellow-800 border-yellow-200",
  B_negative: "bg-yellow-50 text-yellow-700 border-yellow-100",
  AB_positive: "bg-purple-100 text-purple-800 border-purple-200",
  AB_negative: "bg-purple-50 text-purple-700 border-purple-100",
  O_positive: "bg-green-100 text-green-800 border-green-200",
  O_negative: "bg-green-50 text-green-700 border-green-100",
  unknown: "bg-gray-100 text-gray-800 border-gray-200",
} as const;

export const BLOOD_GROUP_LABELS: Record<BloodGroupChoices, string> = {
  A_positive: "A Positive",
  A_negative: "A Negative",
  B_positive: "B Positive",
  B_negative: "B Negative",
  AB_positive: "AB Positive",
  AB_negative: "AB Negative",
  O_positive: "O Positive",
  O_negative: "O Negative",
  unknown: "Unknown",
};

export type GenderChoices = "male" | "female" | "non_binary" | "transgender";

export interface Patient {
  id: string;
  name: string;
  gender: GenderChoices;
  phone_number: string;
  emergency_phone_number?: string;
  address: string;
  permanent_address: string;
  pincode: string;
  date_of_birth: string;
  deceased_datetime?: string;
  blood_group?: BloodGroupChoices;
  year_of_birth: number;
  created_date: string;
  modified_date: string;
  geo_organization: Organization;
  created_by: UserBareMinimum | null;
  updated_by: UserBareMinimum | null;
  permissions: string[];
  nationality?: string;
  partial_id: string;
}

export interface PartialPatientModel {
  id: string;
  gender: GenderChoices;
  name: string;
  phone_number: string;
  partial_id: string;
}
