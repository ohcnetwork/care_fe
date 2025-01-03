import { Code } from "../../questionnaire/code";
import { UserBase } from "../../user/user";

// Base type for allergy data
export interface AllergyIntolerance {
  code: Code;
  clinical_status?: string;
  verification_status?: string;
  category?: string;
  criticality?: string;
  last_occurrence?: string;
  note?: string;
  created_by: UserBase;
  encounter: string;
  edited_by?: UserBase;
}

// Type for API request, extends base type with required fields
export interface AllergyIntoleranceRequest {
  clinical_status: string;
  verification_status: string;
  category: string;
  criticality: string;
  code: Code;
  last_occurrence?: string;
  note?: string;
  encounter: string;
}
