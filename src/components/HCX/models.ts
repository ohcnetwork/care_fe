import { PatientModel } from "@/components/Patient/models";

export type HCXPolicyPriority = "Immediate" | "Normal" | "Deferred";
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
  priority?: HCXPolicyPriority;
  purpose?: HCXPolicyPurpose;
  outcome?: HCXPolicyOutcome;
  error_text?: string;
  created_date?: string;
  modified_date?: string;
}
