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
    description:
      "A container for organizing related questions together. Must contain at least one question.",
  },
  {
    name: "Display",
    value: "display",
    description:
      "Shows text or instructions to users without collecting any answers.",
  },
  {
    name: "Boolean",
    value: "boolean",
    description:
      "A simple yes/no question that users can answer with a single click.",
  },
  {
    name: "Decimal",
    value: "decimal",
    description: "Collects numbers with decimal points (like 3.14 or 2.5).",
  },
  {
    name: "Integer",
    value: "integer",
    description: "Collects whole numbers (like 1, 2, 3).",
  },
  {
    name: "Date",
    value: "date",
    description: "Lets users select a specific date from a calendar.",
  },
  {
    name: "Date Time",
    value: "dateTime",
    description: "Lets users select both a date and time.",
  },
  {
    name: "Time",
    value: "time",
    description: "Lets users select a specific time of day.",
  },
  {
    name: "String",
    value: "string",
    description:
      "A short text field for brief answers like names or single-line responses.",
  },
  {
    name: "Text",
    value: "text",
    description:
      "A larger text area for longer responses like descriptions or detailed explanations.",
  },
  {
    name: "URL",
    value: "url",
    description: "Collects website addresses or links.",
  },
  {
    name: "Choice",
    value: "choice",
    description:
      "Presents a list of predefined options for users to choose from.",
  },
  {
    name: "Quantity",
    value: "quantity",
    description:
      "Collects a number with its unit of measurement (like 5 kg or 2 hours).",
  },
  {
    name: "Structured",
    value: "structured",
    description:
      "A specialized question type for collecting specific types of medical data.",
  },
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
