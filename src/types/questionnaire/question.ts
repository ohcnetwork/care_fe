import { Code } from "./code";

export type QuestionType =
  | "group"
  | "display"
  | "boolean"
  | "decimal"
  | "integer"
  | "date"
  | "dateTime"
  | "time"
  | "string"
  | "text"
  | "url"
  | "choice"
  | "quantity"
  | "structured";

export const SUPPORTED_QUESTION_TYPES = [
  { name: "Group", value: "group" },
  { name: "Display", value: "display" },
  { name: "Boolean", value: "boolean" },
  { name: "Decimal", value: "decimal" },
  { name: "Integer", value: "integer" },
  { name: "Date", value: "date" },
  { name: "DateTime", value: "dateTime" },
  { name: "Time", value: "time" },
  { name: "String", value: "string" },
  { name: "Text", value: "text" },
  { name: "URL", value: "url" },
  { name: "Choice", value: "choice" },
  { name: "Quantity", value: "quantity" },
  { name: "Structured", value: "structured" },
];

export type StructuredQuestionType =
  | "allergy_intolerance"
  | "medication_request"
  | "medication_statement"
  | "symptom"
  | "diagnosis"
  | "encounter"
  | "appointment";

type EnableWhenNumeric = {
  operator: "greater" | "less" | "greater_or_equals" | "less_or_equals";
  answer: number;
};

type EnableWhenBoolean = {
  operator: "exists" | "equals" | "not_equals";
  answer: boolean;
};

type EnableWhenString = {
  operator: "equals" | "not_equals";
  answer: string;
};

export type EnableWhen = {
  question: string;
} & (EnableWhenNumeric | EnableWhenBoolean | EnableWhenString);

export interface AnswerOption {
  value: string;
  display?: string;
  initialSelected?: boolean;
  code?: Code;
}

export interface ObservationType {
  system: string;
  code: string;
  display: string;
}

export interface Question {
  id: string;
  link_id: string;
  code?: Code;
  text: string;
  description?: string;
  type: QuestionType;
  structured_type?: StructuredQuestionType;
  styling_metadata?: {
    classes?: string;
    containerClasses?: string;
  };
  required?: boolean;
  collect_time?: boolean;
  collect_performer?: boolean;
  collect_body_site?: boolean;
  collect_method?: boolean;
  enable_when?: EnableWhen[];
  enable_behavior?: "all" | "any";
  disabled_display?: "hidden" | "protected";
  repeats?: boolean;
  read_only?: boolean;
  max_length?: number;
  answer_constraint?: string;
  answer_option?: AnswerOption[];
  answer_value_set?: string;
  answer_unit?: Code;
  is_observation?: boolean;
  unit?: Code;
  questions?: Question[];
  formula?: string;
}
