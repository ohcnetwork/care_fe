import { Code } from "./code";
import { Question } from "./question";

export type SubjectType = "patient" | "encounter";

export type QuestionStatus = "active" | "retired" | "draft";

export interface QuestionnaireDetail {
  id: string;
  slug: string;
  version?: string;
  code?: Code;
  questions: Question[];
  title: string;
  description?: string;
  status: QuestionStatus;
  subject_type: SubjectType;
}

export interface QuestionnaireUpdate extends QuestionnaireDetail {
  organizations: string[];
}

export interface QuestionnaireForms {
  count: number;
  results: QuestionnaireDetail[];
}
