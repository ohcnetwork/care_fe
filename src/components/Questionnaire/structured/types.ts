import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { ChargeItemUpsert } from "@/types/billing/chargeItem/chargeItem";
import { ApplyMultipleChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEdit } from "@/types/emr/encounter/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { ServiceRequestApplyActivityDefinitionSpec } from "@/types/emr/serviceRequest/serviceRequest";
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
  encounter: EncounterEdit;
  appointment: CreateAppointmentQuestion;
  files: FileUploadQuestion;
  time_of_death: string;
  service_request: ServiceRequestApplyActivityDefinitionSpec;
  charge_item: ChargeItemUpsert;
}

// Map structured types to their request types
export interface StructuredRequestMap {
  allergy_intolerance: { datapoints: AllergyIntoleranceRequest[] };
  medication_request: { datapoints: MedicationRequest[] };
  symptom: { datapoints: SymptomRequest[] };
  diagnosis: { datapoints: DiagnosisRequest[] };
  medication_statement: { datapoints: MedicationStatementRequest[] };
  encounter: EncounterEdit;
  appointment: AppointmentCreateRequest;
  service_request: ServiceRequestApplyActivityDefinitionSpec;
  files: FileUploadQuestion;
  time_of_death: {
    deceased_datetime: string;
  };
  charge_item: ApplyMultipleChargeItemDefinitionRequest;
}

export type RequestTypeFor<T extends StructuredQuestionType> =
  StructuredRequestMap[T];

export type DataTypeFor<T extends StructuredQuestionType> =
  StructuredDataMap[T];
