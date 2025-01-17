import { Code } from "@/types/questionnaire/code";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";

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

export interface QuestionnaireCreate extends Omit<QuestionnaireDetail, "id"> {
  organizations: string[];
}

export interface QuestionnaireForms {
  count: number;
  results: QuestionnaireDetail[];
}
