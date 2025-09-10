export interface QuestionnaireTagBase {
  slug: string;
  name: string;
}

export interface QuestionnaireTagRead extends QuestionnaireTagBase {
  id: string;
}

export interface QuestionnaireTagSet {
  tags: string[];
}
