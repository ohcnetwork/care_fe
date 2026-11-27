import { UserReadMinimal } from "@/types/user/user";

export type FormSubmissionStatus = "draft" | "submitted" | "entered_in_error";

export interface FormSubmissionBase {
  id: string;
}

export interface FormSubmissionUpdate {
  status: FormSubmissionStatus;
  response_dump: Record<string, unknown>;
}

export interface FormSubmissionCreate extends FormSubmissionUpdate {
  questionnaire: string;
  patient: string;
  encounter?: string;
}

export interface FormSubmissionRead
  extends FormSubmissionBase, FormSubmissionUpdate {
  created_date: string;
  modified_date: string | null;
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}
