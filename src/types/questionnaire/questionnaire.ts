import { Code } from "@/types/base/code/code";

import { Question } from "./question";
import { QuestionnaireTagRead } from "./tags";

export type SubjectType = "patient" | "encounter";

export type QuestionStatus = "active" | "retired" | "draft";

export interface QuestionnaireBase {
  slug: string;
  version?: string;
  code?: Code;
  questions: Question[];
  title: string;
  description?: string;
  status: QuestionStatus;
  subject_type: SubjectType;
}

export interface QuestionnaireRead extends QuestionnaireBase {
  id: string;
  tags: QuestionnaireTagRead[];
}

export interface QuestionnaireCreate extends QuestionnaireBase {
  organizations: string[];
  tags: string[];
}

export type QuestionnaireUpdate = QuestionnaireBase;

export interface QuestionnaireSetOrganizations {
  organizations: string[];
}

export const QUESTIONNAIRE_STATUS_COLORS = {
  active: "primary",
  draft: "yellow",
  retired: "destructive",
} as const;
