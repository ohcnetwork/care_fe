import { Code } from "./code";
import { Question } from "./question";
import { QuestionnaireTagModel } from "./tags";

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
  tags: QuestionnaireTagModel[];
}

export interface QuestionnaireCreate
  extends Omit<QuestionnaireDetail, "id" | "tags"> {
  organizations: string[];
  tags: string[];
}

export interface QuestionnaireForms {
  count: number;
  results: QuestionnaireDetail[];
}
