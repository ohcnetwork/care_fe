import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { UserReadMinimal } from "@/types/user/user";

import { QuestionnaireResponse as Response } from "./form";
import { QuestionnaireDetail } from "./questionnaire";

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
  created_by: UserReadMinimal;
}
