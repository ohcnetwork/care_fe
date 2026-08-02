import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";

import type { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import type { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import type { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import type { EncounterEdit } from "@/types/emr/encounter/encounter";
import type { MedicationRequestCreate } from "@/types/emr/medicationRequest/medicationRequest";
import type { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import type { ServiceRequestApplyActivityDefinitionForm } from "@/types/emr/serviceRequest/serviceRequest";
import type { SymptomRequest } from "@/types/emr/symptom/symptom";
import type { FileUploadQuestion } from "@/types/files/file";
import type { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

/** Subject ids a structured type needs before it can render at all —
 *  `StructuredSlot` shows the "requires context" placeholder when the
 *  mount subject lacks one of these. */
export type StructuredContextKey = "patientId" | "encounterId" | "facilityId";

/** What the UI edits per type — one entry of `values[0].value`'s array.
 *  (`time_of_death` stores plain strings.) Mirrors the legacy map in
 *  `components/Questionnaire/structured/types.ts`, which dies with the
 *  legacy fill stack. */
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: MedicationRequestCreate;
  medication_statement: MedicationStatementRequest;
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  encounter: EncounterEdit;
  appointment: CreateAppointmentQuestion;
  files: FileUploadQuestion;
  time_of_death: string;
  service_request: ServiceRequestApplyActivityDefinitionForm;
  charge_item: ApplyChargeItemDefinitionRequest;
}

export type DataTypeFor<K extends StructuredQuestionType> =
  StructuredDataMap[K];

/** One entry of the submit batch (`POST /api/v1/batch_requests/`). */
export interface StructuredBatchEntry {
  url: string;
  method: "POST" | "PUT" | "PATCH";
  reference_id: string;
  body: unknown;
}

/** Context `buildRequests` composes URLs/bodies from. `patientId` is
 *  required because the whole structured leg of submission only runs for
 *  a patient-bound fill (legacy gate). `questionId` keys `reference_id`
 *  so server errors map back to the exact question instance — two
 *  questions of the same structured type no longer collide. */
export interface StructuredRequestContext {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  questionId: string;
}

export function structuredReferenceId(
  type: StructuredQuestionType,
  questionId: string,
): string {
  return `structured:${type}:${questionId}`;
}

/** The prop bag `StructuredSlot` hands every structured input. Adapters
 *  narrow it to the legacy component's own props (subject ids are
 *  guaranteed present for the keys the definition `requires`). */
export interface StructuredInputProps {
  question: Question;
  response: QuestionnaireResponse;
  /** Memoized by the slot; adapters must keep their derived callbacks
   *  referentially stable too (ChargeItemQuestion lists its callback in
   *  an effect dependency array). */
  onChange: (values: ResponseValue[], note?: string) => void;
  disabled: boolean;
  errors: QuestionValidationError[];
  clearError: () => void;
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  /** Fill mode only — template CRUD (real POSTs) stays off preview. */
  questionnaireId?: string;
  questionnaireSlug?: string;
}

/**
 * Everything one structured question type needs, in one place: how it
 * renders, what context it needs, how it validates, how it turns data
 * into API requests, and whether its values are safe to persist in a
 * local draft. The registry is a total record over
 * `StructuredQuestionType` — adding a member to the union refuses to
 * compile until a definition exists.
 */
export interface StructuredTypeDefinition<
  K extends StructuredQuestionType = StructuredQuestionType,
> {
  type: K;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  /** Questionnaire subject types this structured type may appear on —
   *  gates the studio's picker and the fill renderer. */
  subjects: readonly SubjectType[];
  /**
   * `"serialize"` — values are plain user input, safe to store in a local
   * draft and restore later.
   * `"exclude"` — values conflate prefetched server rows with user input
   * (every adapted legacy component seeds responses from server fetches
   * in effects) or hold non-serializable data (`files` carries raw
   * `File`s); restoring a stale snapshot and re-upserting it could
   * clobber edits made elsewhere, so drafts skip these questions.
   */
  draftPolicy: "serialize" | "exclude";
  /** Submit-time validation over the recorded entries (already narrowed
   *  to this type's data shape). Optional — types without client rules
   *  rely on server-side validation. */
  validate?: (
    data: DataTypeFor<K>[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  /** Turn recorded entries into raw batch requests. May return [] when
   *  the context it needs is missing or nothing changed (dirty-row
   *  filtering). Async because some types transform payloads (files →
   *  base64). */
  buildRequests: (
    data: DataTypeFor<K>[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}
