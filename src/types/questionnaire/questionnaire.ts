import { Code } from "./code";
import { Question } from "./question";

export type SubjectType = "patient";

export type QuestionStatus = "active" | "retired" | "draft";

export type QuestionnaireType =
  | "custom"
  | "allergy_intolerance"
  | "medication_request"
  | "medication_statement"
  | "immunization"
  | "encounter";

export interface QuestionnaireDetail {
  id: string;
  slug: string;
  version?: string;
  code?: Code;
  questions: Question[];
  type: QuestionnaireType;
  title: string;
  description?: string;
  status: QuestionStatus;
  subject_type: SubjectType;
}

export interface QuestionnaireForms {
  count: number;
  results: QuestionnaireDetail[];
}
