import { Code } from "../questionnaire/code";
import { UserBase } from "../user/user";

export const ALLERGY_INTOLERANCE_CLINICAL_STATUS = [
  "active",
  "inactive",
  "resolved",
] as const;

export type AllergyIntoleranceClinicalStatus =
  (typeof ALLERGY_INTOLERANCE_CLINICAL_STATUS)[number];

export const ALLERGY_INTOLERANCE_VERIFICATION_STATUS = [
  "unconfirmed",
  "presumed",
  "confirmed",
  "refuted",
  "entered-in-error",
] as const;

export type AllergyIntoleranceVerificationStatus =
  (typeof ALLERGY_INTOLERANCE_VERIFICATION_STATUS)[number];

export const ALLERGY_INTOLERANCE_CATEGORY = [
  "food",
  "medication",
  "environment",
  "biologic",
] as const;

export type AllergyIntoleranceCategory =
  (typeof ALLERGY_INTOLERANCE_CATEGORY)[number];

export const ALLERGY_INTOLERANCE_CRITICALITY = [
  "low",
  "high",
  "unable-to-assess",
] as const;

export type AllergyIntoleranceCriticality =
  (typeof ALLERGY_INTOLERANCE_CRITICALITY)[number];

// Base type for allergy data
export interface AllergyIntolerance {
  code: Code;
  clinical_status?: AllergyIntoleranceClinicalStatus;
  verification_status?: AllergyIntoleranceVerificationStatus;
  category?: AllergyIntoleranceCategory;
  criticality?: AllergyIntoleranceCriticality;
  last_occurrence?: string;
  note?: string;
  created_by: UserBase;
  encounter: string;
  edited_by?: UserBase;
}

// Type for API request, extends base type with required fields
export interface AllergyIntoleranceRequest {
  clinical_status: AllergyIntoleranceClinicalStatus;
  verification_status: AllergyIntoleranceVerificationStatus;
  category: AllergyIntoleranceCategory;
  criticality: AllergyIntoleranceCriticality;
  code: Code;
  last_occurrence?: string;
  note?: string;
  encounter: string;
}
