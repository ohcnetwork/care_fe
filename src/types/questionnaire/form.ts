import { FollowUpAppointmentRequest } from "@/components/Schedule/types";

import { AllergyIntolerance } from "@/types/emr/allergyIntolerance";
import { Encounter } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatement } from "@/types/emr/medicationStatement";
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
    | "medication_statement"
    | "symptom"
    | "diagnosis"
    | "encounter"
    | "follow_up_appointment";

  value?:
    | string
    | number
    | boolean
    | Date
    | AllergyIntolerance[]
    | MedicationRequest[]
    | MedicationStatement[]
    | Symptom[]
    | Diagnosis[]
    | Encounter
    | FollowUpAppointmentRequest;
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
