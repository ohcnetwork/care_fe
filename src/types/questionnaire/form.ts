import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEditRequest } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { SymptomRequest } from "@/types/emr/symptom/symptom";
import { LocationAssociationQuestion } from "@/types/location/association";
import { Code } from "@/types/questionnaire/code";
import { Quantity } from "@/types/questionnaire/quantity";
import { StructuredQuestionType } from "@/types/questionnaire/question";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

type ResponseValueBase = {
  value_code?: Code;
  value_quantity?: Quantity;
};

export type StringResponseValue = ResponseValueBase & {
  type: "string";
  value: string | undefined;
};

export type NumberResponseValue = ResponseValueBase & {
  type: "number";
  value: number | undefined;
};

export type BooleanResponseValue = ResponseValueBase & {
  type: "boolean";
  value: boolean | undefined;
};

export type DateTimeResponseValue = ResponseValueBase & {
  type: "dateTime";
  value: Date | undefined;
};

export type AllergyIntoleranceResponseValue = ResponseValueBase & {
  type: "allergy_intolerance";
  value: AllergyIntoleranceRequest[];
};

export type MedicationRequestResponseValue = ResponseValueBase & {
  type: "medication_request";
  value: MedicationRequest[];
};

export type MedicationStatementResponseValue = ResponseValueBase & {
  type: "medication_statement";
  value: MedicationStatementRequest[];
};

export type LocationAssociationResponseValue = ResponseValueBase & {
  type: "location_association";
  value: LocationAssociationQuestion[];
};

export type SymptomResponseValue = ResponseValueBase & {
  type: "symptom";
  value: SymptomRequest[];
};

export type DiagnosisResponseValue = ResponseValueBase & {
  type: "diagnosis";
  value: DiagnosisRequest[];
};

export type EncounterResponseValue = ResponseValueBase & {
  type: "encounter";
  value: EncounterEditRequest[];
};

export type CreateAppointmentResponseValue = ResponseValueBase & {
  type: "appointment";
  value: CreateAppointmentQuestion[];
};

export type ResponseValue =
  | StringResponseValue
  | NumberResponseValue
  | BooleanResponseValue
  | DateTimeResponseValue
  | AllergyIntoleranceResponseValue
  | MedicationRequestResponseValue
  | MedicationStatementResponseValue
  | LocationAssociationResponseValue
  | SymptomResponseValue
  | DiagnosisResponseValue
  | EncounterResponseValue
  | CreateAppointmentResponseValue;

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
