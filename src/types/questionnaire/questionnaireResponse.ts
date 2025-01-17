import { QuestionnaireResponse as Response } from "@/types/questionnaire/form";
import { StructuredQuestionType } from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import { UserBase } from "@/types/user/user";

export type StructuredResponseValue = {
  id: string;
  submit_type: "CREATE" | "UPDATE";
};

export interface QuestionnaireResponse {
  id: string;
  created_date: string;
  modified_date: string;
  questionnaire?: QuestionnaireDetail;
  subject_id: string;
  responses: Response[];
  encounter: string;
  patient: string;
  structured_responses?: Record<
    StructuredQuestionType,
    StructuredResponseValue
  >;
  created_by: UserBase;
}
