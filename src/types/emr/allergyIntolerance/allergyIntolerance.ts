import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export type AllergyVerificationStatus =
  | "unconfirmed"
  | "confirmed"
  | "refuted"
  | "presumed"
  | "entered_in_error";

export type AllergyClinicalStatus = "active" | "inactive" | "resolved";
export type AllergyCategory =
  | "food"
  | "medication"
  | "environment"
  | "biologic";
export type AllergyCriticality = "low" | "high" | "unable_to_assess";

// Base type for allergy data
export interface AllergyIntolerance {
  id: string;
  code: Code;
  clinical_status: AllergyClinicalStatus;
  verification_status: AllergyVerificationStatus;
  category: AllergyCategory;
  criticality: AllergyCriticality;
  last_occurrence?: string;
  note?: string;
  created_by: UserBase;
  encounter: string;
  edited_by?: UserBase;
}

// Type for API request, extends base type with required fields
// Added optional id here as this type is used only in one place
export interface AllergyIntoleranceRequest {
  id?: string;
  clinical_status: AllergyClinicalStatus;
  verification_status: AllergyVerificationStatus;
  category: AllergyCategory;
  criticality: string;
  code: Code;
  last_occurrence?: string;
  note?: string;
  encounter: string;
}

export const ALLERGY_VERIFICATION_STATUS = {
  unconfirmed: "Unconfirmed",
  confirmed: "Confirmed",
  refuted: "Refuted",
  presumed: "Presumed",
  entered_in_error: "Entered in Error",
} as const;

export const ALLERGY_VERIFICATION_STATUS_STYLES = {
  unconfirmed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  refuted: "bg-red-100 text-red-800 border-red-200",
  presumed: "bg-blue-100 text-blue-800 border-blue-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;

export const ALLERGY_CLINICAL_STATUS_STYLES = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  resolved: "bg-blue-100 text-blue-800 border-blue-200",
} as const;

export const ALLERGY_CRITICALITY_STYLES = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-red-100 text-red-800 border-red-200",
  unable_to_assess: "bg-gray-100 text-gray-800 border-gray-200",
} as const;
