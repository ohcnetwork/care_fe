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
 *  (`time_of_death` stores plain strings.) The sole such map: the legacy
 *  one in `components/Questionnaire/structured/` went with the legacy fill
 *  stack that was its only consumer. */
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

/** Context `buildRequests` composes URLs/bodies from.
 *
 *  `patientId` is GUARANTEED present for a type whose `subjects` are
 *  patient and/or encounter — which is every core type, so core
 *  definitions only need a one-line guard to narrow it. It is optional
 *  because a PLUGIN type may declare a resource subject
 *  (location/device/facility): the studio lets it be authored there and
 *  the slot renders it, so its `buildRequests` must be reachable on a
 *  mount that has no patient at all.
 *
 *  `questionId` keys `reference_id` so server errors map back to the exact
 *  question instance — two questions of the same structured type no longer
 *  collide. */
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

export type StructuredDraftPolicy = "serialize" | "exclude";

/**
 * Everything BOTH contracts share: how it renders, what context it needs,
 * which questionnaire subjects it may appear on, and whether its values are
 * safe to persist in a local draft. Consumers that only need these fields
 * (`StructuredSlot`'s render, `resolveStructuredSlotState`, the draft
 * partition's policy read) never have to discriminate on `contract`.
 */
interface StructuredTypeDefinitionBase<
  K extends StructuredQuestionType = StructuredQuestionType,
> {
  type: K;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  /** Questionnaire subject types this structured type may appear on —
   *  gates the studio's picker and the fill renderer. Unchanged by v2. */
  subjects: readonly SubjectType[];
  /**
   * `"serialize"` — values are user intent, safe to store in a local draft
   * and restore later.
   * `"exclude"` — the values cannot round-trip (`files` carries raw `File`
   * objects). Under contract v2 this is the only legitimate `"exclude"`;
   * under v1 every type is excluded because its values conflate
   * prefetched server rows with user input.
   */
  draftPolicy: StructuredDraftPolicy;
}

/**
 * The LEGACY contract — the adapted `QuestionTypes` widgets. Its
 * `values[0].value` is one array holding prefetched server rows AND user
 * input, so `buildRequests` has to re-derive "what changed" from a `dirty`
 * flag written into the wire payload (`DiagnosisRequest.dirty`,
 * `MedicationRequestCreate.dirty`). Every member of this arm dies in
 * Phase 5 — see the Phase 5 deletion checklist, design annex
 * `docs/superpowers/specs/annexes/p1-shim.md` §d.
 */
export interface StructuredTypeDefinitionV1<
  K extends StructuredQuestionType = StructuredQuestionType,
> extends StructuredTypeDefinitionBase<K> {
  contract: 1;
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

/**
 * Contract v2 — compiles the EDIT LOG, not the displayed rows.
 *
 * `toRequests` gets only what the clinician changed, so an untouched
 * section produces zero requests BY CONSTRUCTION rather than by each type
 * remembering to filter on a dirty flag (P1-14, fixed for every type at
 * once). Each edit's `patch` is a complete row (`StructuredEdit`'s own doc
 * comment, `@/types/questionnaire/structured`), so the differ needs no
 * baseline lookup and `composeBatch` stays pure.
 *
 * `validate` gets BOTH halves because they answer different questions: the
 * PROJECTION answers "is this required section satisfied" (rows the server
 * already had count), while EDITS answer "is what changed well-formed."
 *
 * No `TRow extends object` constraint here (unlike `core/types.ts`'s
 * `EditLog<TRow extends object>`, the internal differ vocabulary) —
 * `time_of_death`'s current `string` row type-checks as
 * `StructuredEdit<string>` today and could be widened to an object row in
 * a later phase without a contract change.
 */
export interface StructuredTypeDefinitionV2<
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

/**
 * One structured type as the registry holds it, under either contract.
 * `contract` is the discriminant: `definition.contract === 2` (or
 * `isV2Definition` from `./contract`) narrows to the arm that has
 * `toRequests`, everything else to the arm that has `buildRequests`, and an
 * object literal carrying BOTH fails the union's excess-property check.
 *
 * The registry is a total record over `StructuredQuestionType` — adding a
 * member to the union refuses to compile until a definition exists for it,
 * on whichever arm it declares (`registry.ts`'s
 * `STRUCTURED_TYPE_REGISTRY`).
 */
export type StructuredTypeDefinition<
  K extends StructuredQuestionType = StructuredQuestionType,
> = StructuredTypeDefinitionV1<K> | StructuredTypeDefinitionV2<K>;
