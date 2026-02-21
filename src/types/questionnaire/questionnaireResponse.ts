import { UserReadMinimal } from "@/types/user/user";

import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";
import { QuestionnaireResponse as Response } from "./form";
import { QuestionnaireRead } from "./questionnaire";

export type StructuredResponseValue = {
  id: string;
  submit_type: "CREATE" | "UPDATE";
};

export enum QuestionnaireResponseStatus {
  Completed = "completed",
  EnteredInError = "entered_in_error",
}

export interface QuestionnaireResponse {
  id: string;
  created_date: string;
  modified_date: string;
  questionnaire?: QuestionnaireRead;
  subject_id: string;
  responses: Response[];
  encounter: string | null;
  status: QuestionnaireResponseStatus;
  structured_responses?: Record<
    StructuredQuestionType,
    StructuredResponseValue
  >;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}

export interface QuestionnaireResponseUpdate {
  status: QuestionnaireResponseStatus;
}
