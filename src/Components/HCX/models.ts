import { ConsultationModel } from "../Facility/models";
import { PatientModel } from "../Patient/models";
import { PerformedByModel } from "./misc";

export type HCXPriority = "Immediate" | "Normal" | "Deferred";

export type HCXPolicyStatus =
  | "Active"
  | "Cancelled"
  | "Draft"
  | "Entered In Error";
export type HCXPolicyPurpose =
  | "Auth Requirements"
  | "Benefits"
  | "Discovery"
  | "Validation";
export type HCXPolicyOutcome =
  | "Queued"
  | "Complete"
  | "Error"
  | "Partial Processing";

export interface HCXPolicyModel {
  id: string;
  patient?: string;
  patient_object?: PatientModel;
  subscriber_id: string;
  policy_id: string;
  insurer_id?: string;
  insurer_name?: string;
  status?: HCXPolicyStatus;
  priority?: HCXPriority;
  purpose?: HCXPolicyPurpose;
  outcome?: HCXPolicyOutcome;
  error_text?: string;
  created_date?: string;
  modified_date?: string;
}

export interface HCXCommunicationModel {
  id?: string;
  identifier?: string;
  claim?: string;
  claim_object?: HCXClaimModel;
  content?: { type: string; data: string }[];
  created_by?: string | null;
  last_modified_by?: string | null;
  created_date?: string;
  modified_date?: string;
}

export interface HCXItemModel {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export type HCXClaimUse = "Claim" | "Pre Authorization" | "Pre Determination";
export type HCXClaimStatus = HCXPolicyStatus;
export type HCXClaimType =
  | "Institutional"
  | "Oral"
  | "Pharmacy"
  | "Professional"
  | "Vision";
export type HCXClaimOutcome = HCXPolicyOutcome;

export interface HCXClaimModel {
  id?: string;
  consultation: string;
  consultation_object?: ConsultationModel;
  policy: string;
  policy_object?: HCXPolicyModel;
  items?: HCXItemModel[];
  total_claim_amount?: number;
  total_amount_approved?: number;
  use?: HCXClaimUse;
  status?: HCXClaimStatus;
  priority?: HCXPriority;
  type?: HCXClaimType;
  outcome?: HCXClaimOutcome;
  error_text?: string;
  created_by?: PerformedByModel;
  last_modified_by?: PerformedByModel;
  created_date?: string;
  modified_date?: string;
}
