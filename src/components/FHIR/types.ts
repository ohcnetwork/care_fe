import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from "fhir/r5";

export interface CareQuestionnaire extends Questionnaire {
  /** Custom version string for Care */
  careVersion: string;

  /** Styling metadata specific to Care */
  stylingMetadata?: {
    care: string;
  };

  /** Override the 'item' property with CareQuestionnaireItem */
  item?: CareQuestionnaireItem[];
}

export interface SavedQuestionnaire extends CareQuestionnaire {
  /** Unique identifier for the questionnaire */
  id: string;
}

export interface CareQuestionnaireItem extends QuestionnaireItem {
  /** Unique machine provided id to the question */
  id: string;

  /** If enabled, collect an additional timestamp per question or group */
  collectTime?: boolean;

  /** Display hidden options or not */
  disabledDisplay?: "hidden" | "protected";

  /** If enabled, a field should be added to capture where the observation was captured */
  collectBodySite?: boolean;

  /** If enabled, a field should be added to capture how the observation was captured */
  collectMethod?: boolean;

  /** Can we support something not from options */
  answerConstraint?: "optionsOnly" | "optionsOrType" | "optionsOrString";

  /** Should this item be stored as an observation */
  isObservation?: boolean;

  /** Formula that uses eval() in js to evaluate to a value */
  formula?: string;

  /** Override the 'item' property with CareQuestionnaireItem for nested questions */
  item?: CareQuestionnaireItem[];

  /** Override enableWhen to use the simplified structure */
  enableWhen?: CareEnableWhen[];
}

export interface CareEnableWhen {
  /** Link Id of the question to check against */
  question: string;

  /** Operator for the condition */
  operator: "exists" | "=" | "!=" | ">" | "<" | ">=" | "<=";

  /** Value for operator, store value based on type of question */
  answer: QuestionnaireResponseItemAnswer;
}

export interface CareQuestionnaireResponse extends QuestionnaireResponse {
  /** Custom version string for Care */
  careVersion?: string;

  /** Override the 'item' property with CareQuestionnaireResponseItem */
  item?: CareQuestionnaireResponseItem[];
}

export interface CareQuestionnaireResponseItem
  extends QuestionnaireResponseItem {
  /** Unique machine provided id to the question */
  id?: string;

  /** Override the 'answer' property with CareQuestionnaireResponseItemAnswer */
  answer?: QuestionnaireResponseItemAnswer[];

  /** Override the 'item' property with CareQuestionnaireResponseItem for nested items */
  item?: CareQuestionnaireResponseItem[];
}
