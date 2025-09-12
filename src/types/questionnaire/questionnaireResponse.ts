import { UserReadMinimal } from "@/types/user/user";

import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";
import { QuestionnaireResponse as Response } from "./form";
import { QuestionnaireRead } from "./questionnaire";

export type StructuredResponseValue = {
  id: string;
  submit_type: "CREATE" | "UPDATE";
};

export interface QuestionnaireResponse {
  id: string;
  created_date: string | null;
  modified_date: string | null;
  questionnaire?: QuestionnaireRead;
  subject_id: string;
  responses: Response[];
  encounter: string | null;
  structured_responses?: Record<
    StructuredQuestionType,
    StructuredResponseValue
  >;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}
