import { AllergyIntolerance } from "@/types/emr/allergyIntolerance";
import { Encounter } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { Code } from "@/types/questionnaire/code";
import { Quantity } from "@/types/questionnaire/quantity";
import { StructuredQuestionType } from "@/types/questionnaire/question";

import { Diagnosis } from "./diagnosis";
import { Symptom } from "./symptom";

export type ResponseValue = {
  type:
    | "string"
    | "number"
    | "boolean"
    | "dateTime"
    | "allergy_intolerance"
    | "medication_request"
    | "symptom"
    | "diagnosis"
    | "encounter";

  value?:
    | string
    | number
    | boolean
    | Date
    | AllergyIntolerance[]
    | MedicationRequest[]
    | Symptom[]
    | Diagnosis[]
    | Encounter;
  value_code?: Code;
  value_quantity?: Quantity;
};

export interface QuestionnaireResponse {
  question_id: string;
  structured_type: StructuredQuestionType | null;
  link_id: string;
  values: ResponseValue[];
  note?: string;
  taken_at?: string;
  body_site?: Code;
  method?: Code;
}
