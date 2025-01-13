import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { Diagnosis, DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { Encounter, EncounterEditRequest } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatement } from "@/types/emr/medicationStatement";
import { Symptom, SymptomRequest } from "@/types/emr/symptom/symptom";
import { StructuredQuestionType } from "@/types/questionnaire/question";
import {
  AppointmentCreateRequest,
  CreateAppointmentQuestion,
} from "@/types/scheduling/schedule";

// Map structured types to their data types
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: MedicationRequest;
  medication_statement: MedicationStatement;
  symptom: Symptom;
  diagnosis: Diagnosis;
  encounter: Encounter;
  appointment: CreateAppointmentQuestion;
}

// Map structured types to their request types
export interface StructuredRequestMap {
  allergy_intolerance: { datapoints: AllergyIntoleranceRequest[] };
  medication_request: { datapoints: MedicationRequest[] };
  medication_statement: { datapoints: MedicationStatement[] };
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  encounter: EncounterEditRequest;
  appointment: AppointmentCreateRequest;
}

export type RequestTypeFor<T extends StructuredQuestionType> =
  StructuredRequestMap[T];

export type DataTypeFor<T extends StructuredQuestionType> =
  StructuredDataMap[T];
