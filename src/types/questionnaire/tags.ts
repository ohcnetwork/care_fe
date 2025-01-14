export interface QuestionnaireTagModel {
  id: string;
  slug: string;
  name: string;
}

export type QuestionnaireTag = Omit<QuestionnaireTagModel, "id">;

export interface QuestionnaireTagSet {
  tags: string[];
}
