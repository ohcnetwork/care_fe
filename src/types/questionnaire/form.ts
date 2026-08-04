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
  // Widened for the dual contract: `string[]` is what the legacy
  // `DeathQuestion` widget writes (`QuestionTypes/DeathQuestion.tsx:32`),
  // `TimeOfDeathRow[]` is what the v2 projection writes. Both arms are
  // live until Phase 5 deletes the widget, at which point this narrows to
  // `TimeOfDeathRow[]` in the deletion commit. Replacing the arm outright
  // now would break the still-compiled legacy file, which master-plan
  // sequencing rule 3 forbids touching before Phase 5.
  | RV<"time_of_death", string[] | TimeOfDeathRow[]>
  | RV<"files", FileUploadQuestion[]>
  | RV<"time", string | undefined>
  // `ChargeItemQuestionRow` widens `ApplyChargeItemDefinitionRequest` with
  // two OPTIONAL display objects (`structured/types/chargeItem/model.ts`'s
  // `ChargeItemRow` requires the definition one; this arm keeps both
  // optional because the legacy widget writes rows with neither) — every
  // plain `ApplyChargeItemDefinitionRequest[]` the legacy widget writes
  // stays assignable here without a union, so this arm needed no widening
  // syntax the way `time_of_death`'s did.
  | RV<"charge_item", ChargeItemQuestionRow[]>
  | RV<"service_request", ServiceRequestApplyActivityDefinitionForm[]>;

export interface QuestionnaireResponse {
  question_id: string;
  structured_type: StructuredTypeValue | null;
  link_id: string;
  /**
   * For a plain question: the recorded answers.
   * For a CONTRACT-V2 structured question: the PROJECTION
   * (`baseline + edits`), maintained mechanically by
   * `structured/core/useStructuredRows` and read by everything that has
   * always read it — the answered predicate (`entryHasContent`, engine
   * store :372-376), the fill outline's completion ticks, the required
   * check (`form/validation.ts:103-112`), readonly/preview renderers and
   * the server-draft dump. It is DISPLAY state: nothing submits from it
   * under v2, and drafts strip it.
   */
  values: ResponseValue[];
  /**
   * Contract-v2 structured questions only — what the clinician actually
   * changed (spec §3). Absent everywhere else, and absent is identical to
   * empty (`structuredEditsOf`).
   *
   * This is the ONLY thing `composeBatch` compiles for a v2 question and
   * the ONLY structured content a draft persists, which is what makes an
   * untouched section emit zero requests (P1-14) and a structured-only
   * change arm the unsaved-changes prompt (P1-3).
   *
   * Type-erased (`patch: unknown`) because a row shape is opaque outside
   * its own type module; `registry.ts` holds the single sanctioned
   * narrowing back, exactly as it does for `values[0].value`.
   *
   * Never sent to the questionnaire submit endpoint: `composeBatch`'s
   * `results` map (composeBatch.ts:233-240) picks `question_id`, `values`,
   * `note`, `body_site` and `method` explicitly. It DOES ride into a
   * resumed draft's completion PUT dump (composeBatch.ts:290-297), where
   * `response_dump` is a free-form JSON blob
   * (`types/questionnaire/formSubmission.ts:11`) — harmless, and it makes
   * the archived record say what was changed as well as what was shown.
   */
  edits?: StructuredEditRecord[];
  note?: string;
  taken_at?: string;
  body_site?: Code;
  method?: Code;
}
