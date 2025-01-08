import { Code } from "../../questionnaire/code";
import { UserBase } from "../../user/user";

// Base type for allergy data
export interface AllergyIntolerance {
  id: string;
  code: Code;
  clinical_status: string;
  verification_status: string;
  category: string;
  criticality: string;
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
  clinical_status: string;
  verification_status: string;
  category: string;
  criticality: string;
  code: Code;
  last_occurrence?: string;
  note?: string;
  encounter: string;
}
