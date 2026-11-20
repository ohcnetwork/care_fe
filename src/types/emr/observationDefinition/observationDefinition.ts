import { Code } from "@/types/base/code/code";
import { QualifiedRange } from "@/types/base/qualifiedRange/qualifiedRange";
import { SlugConfig } from "@/types/base/slug/slugConfig";
import { FacilityBareMinimum } from "@/types/facility/facility";
import {
  ObservationDefinitionCategory,
  ObservationDefinitionStatus,
} from "./observationDefinitionEnums";

export { ObservationDefinitionCategory, ObservationDefinitionStatus };

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

export interface ObservationDefinitionEmbedded extends BaseObservationDefinition {
  id: string;
}

export interface ObservationDefinitionCreate extends BaseObservationDefinition {
  slug_value: string;
  facility?: string | null;
}

export interface ObservationDefinitionUpdate extends BaseObservationDefinition {
  slug_value: string;
}

export const OBSERVATION_DEFINITION_STATUS_COLORS = {
  [ObservationDefinitionStatus.DRAFT]: "secondary",
  [ObservationDefinitionStatus.ACTIVE]: "primary",
  [ObservationDefinitionStatus.RETIRED]: "destructive",
  [ObservationDefinitionStatus.UNKNOWN]: "outline",
} as const satisfies Record<ObservationDefinitionStatus, string>;
