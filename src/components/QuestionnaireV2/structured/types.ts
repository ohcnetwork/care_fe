import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type {
  StructuredEdit,
  StructuredQuestionType,
} from "@/types/questionnaire/structured";
import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";

import type { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import type { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import type { EncounterEdit } from "@/types/emr/encounter/encounter";
import type { MedicationRequestCreate } from "@/types/emr/medicationRequest/medicationRequest";
import type { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import type { SymptomRequest } from "@/types/emr/symptom/symptom";
import type { FileUploadQuestion } from "@/types/files/file";
import type { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

// Type-only: `structured/types/chargeItem/model.ts` (and, identically,
// `structured/types/serviceRequest/model.ts`) imports `structuredReferenceId`
// (a value) back from THIS file. The cycle resolves because this direction
// is `import type` only — do not add a value import in either direction.
import type { ChargeItemRow } from "@/components/QuestionnaireV2/structured/types/chargeItem/model";
import type { ServiceRequestRow } from "@/components/QuestionnaireV2/structured/types/serviceRequest/model";

/** Subject ids a structured type needs before it can render at all —
 *  `StructuredSlot` shows the "requires context" placeholder when the
 *  mount subject lacks one of these. */
export type StructuredContextKey = "patientId" | "encounterId" | "facilityId";

/** What the UI edits per type — one entry of `values[0].value`'s array. */
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: MedicationRequestCreate;
  medication_statement: MedicationStatementRequest;
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  encounter: EncounterEdit;
  appointment: CreateAppointmentQuestion;
  files: FileUploadQuestion;
  /** Widened from a plain `string` to an object row — the state core
   *  constrains rows to `TRow extends object`; see `TimeOfDeathRow`'s own
   *  doc comment (`@/types/questionnaire/structuredRows`). */
  time_of_death: TimeOfDeathRow;
  /** `ServiceRequestRow` (`structured/types/serviceRequest/model.ts`)
   *  requires the picked activity-definition display object — every
   *  v2-edited row carries one, since the editor only ever creates a row
   *  from a direct pick or a resolved template. Same reasoning as
   *  `ChargeItemRow`, below. */
  service_request: ServiceRequestRow;
  /** `ChargeItemRow` (`structured/types/chargeItem/model.ts`) requires the
   *  definition display object the `ResponseValue`/`ChargeItemQuestionRow`
   *  arm keeps optional — every v2-edited row carries one, since the
   *  editor only ever creates a row from a picked definition. */
  charge_item: ChargeItemRow;
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

/** Context `toRequests` composes URLs/bodies from.
 *
 *  `patientId` is guaranteed for patient/encounter types and optional for
 *  plugin resource-subject types. `questionId` keys `reference_id` so server
 *  errors map back to the exact question instance. */
export interface StructuredRequestContext {
  patientId?: string;
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

/** The prop bag `StructuredSlot` hands every structured input. */
export interface StructuredInputProps {
  question: Question;
  response: QuestionnaireResponse;
  /** Memoized by the slot; adapters must keep their derived callbacks
   *  referentially stable too, since inputs may list them in effect
   *  dependency arrays. */
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

export type StructuredDraftPolicy = "serialize" | "exclude";

/**
 * Everything a structured type shares: how it renders, what context it
 * needs, which questionnaire subjects it may appear on, and whether its
 * values are safe to persist in a local draft.
 */
interface StructuredTypeDefinitionBase<
  K extends StructuredQuestionType = StructuredQuestionType,
> {
  type: K;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  /** Questionnaire subject types this structured type may appear on —
   *  gates the studio's picker and the fill renderer. */
  subjects: readonly SubjectType[];
  /**
   * `"serialize"` — values are user intent, safe to store in a local draft
   * and restore later.
   * `"exclude"` — the values cannot round-trip (`files` carries raw `File`
   * objects) — the only legitimate use of this value.
   */
  draftPolicy: StructuredDraftPolicy;
}

/**
 * One structured type as the registry holds it. `toRequests` compiles only the
 * edit log, so untouched sections emit zero requests by construction.
 * `validate` receives projection for required checks and edits for
 * well-formedness checks. `contract: 2` is a version tag shared by core and
 * plugin types.
 */
export interface StructuredTypeDefinition<
  K extends StructuredQuestionType = StructuredQuestionType,
> extends StructuredTypeDefinitionBase<K> {
  contract: 2;
  validate?: (
    projection: readonly DataTypeFor<K>[],
    edits: readonly StructuredEdit<DataTypeFor<K>>[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  toRequests: (
    edits: readonly StructuredEdit<DataTypeFor<K>>[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}
