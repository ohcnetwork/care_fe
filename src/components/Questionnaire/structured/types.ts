import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEditRequest } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { SymptomRequest } from "@/types/emr/symptom/symptom";
import { FileUploadQuestion } from "@/types/files/files";
import {
  AppointmentCreateRequest,
  CreateAppointmentQuestion,
} from "@/types/scheduling/schedule";

// Map structured types to their data types
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: MedicationRequest;
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  medication_statement: MedicationStatementRequest;
  encounter: EncounterEditRequest;
  appointment: CreateAppointmentQuestion;
  files: FileUploadQuestion;
  time_of_death: string;
}

// Map structured types to their request types
export interface StructuredRequestMap {
  allergy_intolerance: { datapoints: AllergyIntoleranceRequest[] };
  medication_request: { datapoints: MedicationRequest[] };
  symptom: { datapoints: SymptomRequest[] };
  diagnosis: { datapoints: DiagnosisRequest[] };
  medication_statement: { datapoints: MedicationStatementRequest[] };
  encounter: EncounterEditRequest;
  appointment: AppointmentCreateRequest;
  files: FileUploadQuestion;
  time_of_death: {
    deceased_datetime: string;
  };
}

export type RequestTypeFor<T extends StructuredQuestionType> =
  StructuredRequestMap[T];

export type DataTypeFor<T extends StructuredQuestionType> =
  StructuredDataMap[T];
