import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { Code } from "@/types/base/code/code";
import { ChargeItemUpsert } from "@/types/billing/chargeItem/chargeItem";
import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEditRequest } from "@/types/emr/encounter/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { SymptomRequest } from "@/types/emr/symptom/symptom";
import { FileUploadQuestion } from "@/types/files/files";
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
  | RV<"number", number | undefined>
  | RV<"boolean", boolean | undefined>
  | RV<"dateTime", Date | undefined>
  | RV<"date", Date | undefined>
  | RV<"quantity", number | undefined>
  | RV<"allergy_intolerance", AllergyIntoleranceRequest[]>
  | RV<"medication_request", MedicationRequest[]>
  | RV<"medication_statement", MedicationStatementRequest[]>
  | RV<"symptom", SymptomRequest[]>
  | RV<"diagnosis", DiagnosisRequest[]>
  | RV<"encounter", EncounterEditRequest[]>
  | RV<"appointment", CreateAppointmentQuestion[]>
  | RV<"time_of_death", string[]>
  | RV<"files", FileUploadQuestion[]>
  | RV<"time", string | undefined>
  | RV<"charge_item", ChargeItemUpsert[]>;

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
