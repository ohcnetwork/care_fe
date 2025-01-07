import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { Diagnosis } from "@/types/emr/diagnosis/diagnosis";
import { Encounter } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatement } from "@/types/emr/medicationStatement";
import { Symptom } from "@/types/emr/symptom/symptom";
import { Code } from "@/types/questionnaire/code";
import { Quantity } from "@/types/questionnaire/quantity";
import { StructuredQuestionType } from "@/types/questionnaire/question";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

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
    | "appointment";

  value?:
    | string
    | number
    | boolean
    | Date
    | AllergyIntoleranceRequest[]
    | MedicationRequest[]
    | MedicationStatement[]
    | Symptom[]
    | Diagnosis[]
    | Encounter
    | CreateAppointmentQuestion;
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
