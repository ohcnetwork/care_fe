import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { Code } from "@/types/base/code/code";
import { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import {
  AllergyIntolerance,
  AllergyIntoleranceRequest,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { Diagnosis, DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEdit, EncounterRead } from "@/types/emr/encounter/encounter";
import {
  MedicationRequestCreate,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import {
  MedicationStatementRead,
  MedicationStatementRequest,
} from "@/types/emr/medicationStatement";
import { Symptom, SymptomRequest } from "@/types/emr/symptom/symptom";
import { FileUploadQuestion } from "@/types/files/file";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

/**
 * A short hand for defining response value types
 */
type RV<T extends string, V> = {
  coding?: Code;
  unit?: Code;
  type: T;
  value?: V;
};

export type ResponseValue =
  | RV<"string", string | undefined>
  | RV<"number", number | string | undefined>
  | RV<"boolean", boolean | undefined>
  | RV<"dateTime", Date | undefined>
  | RV<"date", Date | undefined>
  | RV<"quantity", number | undefined>
  | RV<"allergy_intolerance", AllergyIntoleranceRequest[]>
  | RV<"medication_request", MedicationRequestCreate[]>
  | RV<"medication_statement", MedicationStatementRequest[]>
  | RV<"symptom", SymptomRequest[]>
  | RV<"diagnosis", DiagnosisRequest[]>
  | RV<"encounter", EncounterEdit[]>
  | RV<"appointment", CreateAppointmentQuestion[]>
  | RV<"time_of_death", string[]>
  | RV<"files", FileUploadQuestion[]>
  | RV<"time", string | undefined>
  | RV<"charge_item", ApplyChargeItemDefinitionRequest[]>;

/**
 * Raw read records fetched by structured questions that preview existing data.
 * A single response's `context` holds one member type (all Diagnosis, all Symptom,
 * …) — the union is across question types, not mixed within one array.
 */
export type ResponseContext =
  | Diagnosis
  | Symptom
  | MedicationRequestRead
  | MedicationStatementRead
  | AllergyIntolerance
  | EncounterRead;

/**
 * Structured types that preview existing data and therefore carry `context`.
 * Single source of truth — keep in lockstep with the `ResponseContext` union
 * (one entry per member) and the component that seeds it. ServiceRequest is
 * excluded: it shows no active orders, so there is nothing to snapshot.
 */
export const CONTEXT_STRUCTURED_TYPES = [
  "diagnosis",
  "symptom",
  "medication_request",
  "medication_statement",
  "allergy_intolerance",
  "encounter",
] as const satisfies readonly StructuredQuestionType[];

export interface QuestionnaireResponse {
  question_id: string;
  structured_type: StructuredQuestionType | null;
  link_id: string;
  values: ResponseValue[];
  /** Raw fetched records; draft-only, never sent on submit. */
  context?: ResponseContext[];
  note?: string;
  taken_at?: string;
  body_site?: Code;
  method?: Code;
}
