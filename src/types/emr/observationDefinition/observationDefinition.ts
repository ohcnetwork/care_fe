import { Code } from "@/types/base/code/code";
import { QualifiedRange } from "@/types/base/qualifiedRange/qualifiedRange";
import { SlugConfig } from "@/types/base/slug/slugConfig";
import { FacilityBareMinimum } from "@/types/facility/facility";

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
  permitted_unit?: Code;
  qualified_ranges: QualifiedRange[];
}

export enum ObservationDefinitionCategory {
  SOCIAL_HISTORY = "social_history",
  VITAL_SIGNS = "vital_signs",
  IMAGING = "imaging",
  LABORATORY = "laboratory",
  PROCEDURE = "procedure",
  SURVEY = "survey",
  EXAM = "exam",
  THERAPY = "therapy",
  ACTIVITY = "activity",
}

export interface BaseObservationDefinition {
  title: string;
  status: ObservationDefinitionStatus;
  description: string;
  category: ObservationDefinitionCategory;
  code: Code;
  permitted_data_type: QuestionType;
  component: ObservationDefinitionComponent[] | null;
  body_site: Code | null;
  method: Code | null;
  permitted_unit?: Code | null;
  derived_from_uri?: string;
  qualified_ranges: QualifiedRange[];
}

export interface ObservationDefinitionRead extends BaseObservationDefinition {
  id: string;
  slug: string;
  slug_config: SlugConfig;
  version?: number;
  facility?: FacilityBareMinimum | null;
}

export interface ObservationDefinitionCreate extends BaseObservationDefinition {
  slug_value: string;
  facility?: string | null;
}

export interface ObservationDefinitionUpdate extends BaseObservationDefinition {
  slug_value: string;
}

export enum ObservationDefinitionStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  RETIRED = "retired",
  UNKNOWN = "unknown",
}

export const OBSERVATION_DEFINITION_STATUS_COLORS = {
  [ObservationDefinitionStatus.DRAFT]: "secondary",
  [ObservationDefinitionStatus.ACTIVE]: "primary",
  [ObservationDefinitionStatus.RETIRED]: "destructive",
  [ObservationDefinitionStatus.UNKNOWN]: "outline",
} as const satisfies Record<ObservationDefinitionStatus, string>;
