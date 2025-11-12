import { Code } from "@/types/base/code/code";
import { QualifiedRange } from "@/types/base/qualifiedRange/qualifiedRange";
import { SlugConfig } from "@/types/base/slug/slugConfig";

export enum QuestionType {
  boolean = "boolean",
  decimal = "decimal",
  integer = "integer",
  dateTime = "dateTime",
  time = "time",
  string = "string",
  quantity = "quantity",
}

export interface ObservationDefinitionComponent {
  code: Code;
  permitted_data_type: QuestionType;
  permitted_unit: Code | null;
  qualified_ranges: QualifiedRange[];
}

export const OBSERVATION_DEFINITION_CATEGORY = [
  "social_history",
  "vital_signs",
  "imaging",
  "laboratory",
  "procedure",
  "survey",
  "exam",
  "therapy",
  "activity",
] as string[];

export interface BaseObservationDefinition {
  title: string;
  status: ObservationDefinitionStatus;
  description: string;
  category: (typeof OBSERVATION_DEFINITION_CATEGORY)[number];
  code: Code;
  permitted_data_type: QuestionType;
  component: ObservationDefinitionComponent[];
  body_site: Code | null;
  method: Code | null;
  permitted_unit: Code | null;
  derived_from_uri?: string;
  qualified_ranges: QualifiedRange[];
}

export interface ObservationDefinitionRead extends BaseObservationDefinition {
  id: string;
  slug: string;
  slug_config: SlugConfig;
  version?: number;
  facility?: {
    id: string;
    name: string;
  } | null;
}

export interface ObservationDefinitionCreate extends BaseObservationDefinition {
  slug_value: string;
  facility?: string | null;
}

export interface ObservationDefinitionUpdate extends BaseObservationDefinition {
  slug_value: string;
}

export const OBSERVATION_DEFINITION_STATUS = [
  "draft",
  "active",
  "retired",
  "unknown",
] as const;

export const OBSERVATION_DEFINITION_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  retired: "destructive",
  unknown: "outline",
} as const satisfies Record<ObservationDefinitionStatus, string>;

export type ObservationDefinitionStatus =
  (typeof OBSERVATION_DEFINITION_STATUS)[number];
