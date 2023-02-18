import { PatientModel } from "../Patient/models";

export type HCXPolicyStatus =
  | "Active"
  | "Cancelled"
  | "Draft"
  | "Entered in Error";
export type HCXPolicyPriority = "Immediate" | "Normal" | "Deferred";
export type HCXPolicyPurpose =
  | "Auth Requirements"
  | "Benefits"
  | "Discovery"
  | "Validation";
export type HCXPolicyOutcome =
  | "Queued"
  | "Processing Complete"
  | "Error"
  | "Partial Processing";

export interface HCXPolicyModel {
  id: string;
  patient?: string;
  patient_object?: PatientModel;
  subscriber_id: string;
  policy_id: string;
  insurer_id: string;
  insurer_name: string;
  status?: HCXPolicyStatus;
  priority?: "Immediate" | "Normal" | "Deferred";
  purpose?: "Auth Requirements" | "Benefits" | "Discovery" | "Validation";
  outcome?: "Queued" | "Processing Complete" | "Error" | "Partial Processing";
  error_text?: string;
  created_date?: string;
  modified_date?: string;
}
