import { Code } from "@/types/base/code/code";
import { ChargeItemQuestionRow } from "@/types/billing/chargeItem/chargeItem";
import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEdit } from "@/types/emr/encounter/encounter";
import { MedicationRequestCreate } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { ServiceRequestApplyActivityDefinitionForm } from "@/types/emr/serviceRequest/serviceRequest";
import { SymptomRequest } from "@/types/emr/symptom/symptom";
import { FileUploadQuestion } from "@/types/files/file";
import {
  StructuredEditRecord,
  StructuredTypeValue,
} from "@/types/questionnaire/structured";
import { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";
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
  // Both serialized strings and structured rows are accepted while both
  // time-of-death writers remain compiled.
  | RV<"time_of_death", string[] | TimeOfDeathRow[]>
  | RV<"files", FileUploadQuestion[]>
  | RV<"time", string | undefined>
  // `ChargeItemQuestionRow` widens `ApplyChargeItemDefinitionRequest` with
  // two OPTIONAL display objects (`structured/types/chargeItem/model.ts`'s
  // `ChargeItemRow` requires the definition one; this arm keeps both
  // optional because plain `ApplyChargeItemDefinitionRequest[]` rows may carry
  // neither; those rows stay assignable here without an additional union arm.
  | RV<"charge_item", ChargeItemQuestionRow[]>
  | RV<"service_request", ServiceRequestApplyActivityDefinitionForm[]>;

export interface QuestionnaireResponse {
  question_id: string;
  structured_type: StructuredTypeValue | null;
  link_id: string;
  /**
   * For a plain question: the recorded answers.
   * For a structured question: the projection (`baseline + edits`), read by
   * answered predicates, outline completion ticks, required checks,
   * readonly/preview renderers and server-draft dumps. It is display state:
   * nothing submits from it, and drafts strip it.
   */
  values: ResponseValue[];
  /**
   * Structured questions only: what the clinician actually changed. Absent is
   * identical to empty. Batch composition and drafts use this edit log rather
   * than projection display state.
   *
   * Type-erased (`patch: unknown`) because row shapes are opaque outside their
   * own type module; the registry boundary performs the sanctioned narrowing.
   * It is never sent to the questionnaire submit endpoint, but may be included
   * in free-form server-draft dumps.
   */
  edits?: StructuredEditRecord[];
  note?: string;
  taken_at?: string;
  body_site?: Code;
  method?: Code;
}
