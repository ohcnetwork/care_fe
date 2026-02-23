import { Code } from "@/types/base/code/code";
import { Interpretation } from "@/types/base/qualifiedRange/qualifiedRange";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { QuestionType } from "@/types/questionnaire/question";
import { SubjectType } from "@/types/questionnaire/questionnaire";
import { UserReadMinimal } from "@/types/user/user";

export enum ObservationStatus {
  FINAL = "final",
  AMENDED = "amended",
  ENTERED_IN_ERROR = "entered_in_error",
}

export enum PerformerType {
  RELATED_PERSON = "related_person",
  USER = "user",
}

export interface Performer {
  type: PerformerType;
  id: string;
}

export interface ObservationReferenceRange {
  min?: number;
  max?: number;
  interpretation?: Interpretation;
}

export type QuestionnaireSubmitResultValue = {
  value?: string | null;
  unit?: Code;
  coding?: Code;
};

// Based on backend Component
export interface ObservationComponent {
  value: QuestionnaireSubmitResultValue;
  interpretation?: Interpretation;
  reference_range?: ObservationReferenceRange[];
  code?: Code | null;
  note?: string;
}

export interface CodeableConcept {
  id?: string;
  coding?: Code[];
  text?: string | null;
}

// Based on backend BaseObservationSpec
export interface ObservationBase {
  id: string; // UUID4 | null
  status: ObservationStatus;
  category?: Code | null;
  main_code?: Code | null;
  alternate_coding?: CodeableConcept | null;
  subject_type: SubjectType;
  encounter: string | null; // UUID4 | null
  effective_datetime: string; // datetime
  performer?: Performer | null;
  value_type: QuestionType;
  value: QuestionnaireSubmitResultValue;
  note?: string | null;
  body_site?: Code | null; // ValueSetBoundCoding<...>
  method?: Code | null; // ValueSetBoundCoding<...>
  reference_range?: ObservationReferenceRange[];
  interpretation?: Interpretation;
  parent?: string | null; // UUID4 | null
  questionnaire_response?: string | null; // UUID4 | null
  component?: ObservationComponent[];
}

export interface ObservationListRead extends ObservationBase {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  data_entered_by?: UserReadMinimal | null;
}

export interface ObservationRead extends ObservationListRead {
  observation_definition?: ObservationDefinitionReadSpec | null;
}

export type ObservationCreate = Omit<ObservationBase, "id">;

export type ObservationUpsert = Omit<
  ObservationBase,
  "id" | "encounter" | "subject_type"
>;

export interface ObservationAnalyzeRequest {
  codes: Code[];
  page_size?: number;
}

export interface ObservationAnalyzeGroup {
  code: Code;
  results: ObservationListRead[];
}
export interface ObservationAnalyzeResponse {
  results: ObservationAnalyzeGroup[];
}

export interface ObservationUpsertRequest {
  observation: ObservationUpsert;
  observation_id?: string | null;
  observation_definition?: string | null;
}

export interface ObservationBatchUpsertRequest {
  observations: ObservationUpsertRequest[];
}

export interface ObservationBatchUpsertResponse {
  message: string;
}

export type ObservationPlotConfig = {
  id: string;
  name: string;
  groups: {
    title: string;
    codes: Code[];
  }[];
}[];
