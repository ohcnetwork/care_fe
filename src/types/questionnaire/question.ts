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
  {
    name: "Group",
    value: "group",
    description: "question_type_group_description",
  },
  {
    name: "Display",
    value: "display",
    description: "question_type_display_description",
  },
  {
    name: "Boolean",
    value: "boolean",
    description: "question_type_boolean_description",
  },
  {
    name: "Decimal",
    value: "decimal",
    description: "question_type_decimal_description",
  },
  {
    name: "Integer",
    value: "integer",
    description: "question_type_integer_description",
  },
  {
    name: "Date",
    value: "date",
    description: "question_type_date_description",
  },
  {
    name: "Date Time",
    value: "dateTime",
    description: "question_type_date_time_description",
  },
  {
    name: "Time",
    value: "time",
    description: "question_type_time_description",
  },
  {
    name: "String",
    value: "string",
    description: "question_type_string_description",
  },
  {
    name: "Text",
    value: "text",
    description: "question_type_text_description",
  },
  {
    name: "URL",
    value: "url",
    description: "question_type_url_description",
  },
  {
    name: "Choice",
    value: "choice",
    description: "question_type_choice_description",
  },
  {
    name: "Quantity",
    value: "quantity",
    description: "question_type_quantity_description",
  },
  {
    name: "Structured",
    value: "structured",
    description: "question_type_structured_description",
  },
];

export type StructuredQuestionType =
  | "allergy_intolerance"
  | "medication_request"
  | "medication_statement"
  | "symptom"
  | "diagnosis"
  | "encounter"
  | "appointment"
  | "files";

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
  is_component?: boolean;
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
