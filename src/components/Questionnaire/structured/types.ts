import {
  AllergyIntolerance,
  AllergyIntoleranceRequest,
} from "@/types/emr/allergyIntolerance";
import { Encounter, EncounterRequest } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { Diagnosis, DiagnosisRequest } from "@/types/questionnaire/diagnosis";
import { StructuredQuestionType } from "@/types/questionnaire/question";
import { Symptom, SymptomRequest } from "@/types/questionnaire/symptom";

// Map structured types to their data types
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntolerance;
  medication_request: MedicationRequest;
  symptom: Symptom;
  diagnosis: Diagnosis;
  encounter: Encounter;
}

// Map structured types to their request types
export interface StructuredRequestMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: { datapoints: MedicationRequest[] };
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  encounter: EncounterRequest;
}

export type RequestTypeFor<T extends StructuredQuestionType> =
  StructuredRequestMap[T];

export type DataTypeFor<T extends StructuredQuestionType> =
  StructuredDataMap[T];
