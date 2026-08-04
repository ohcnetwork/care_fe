import type { ComponentType } from "react";
import type { z } from "zod";

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
// is `import type` only — do not add a value import in either direction
// (N6/Task 5 brief).
import type { ChargeItemRow } from "@/components/QuestionnaireV2/structured/types/chargeItem/model";
import type { ServiceRequestRow } from "@/components/QuestionnaireV2/structured/types/serviceRequest/model";

/** Subject ids a structured type needs before it can render at all —
 *  `StructuredSlot` shows the "requires context" placeholder when the
 *  mount subject lacks one of these. */
export type StructuredContextKey = "patientId" | "encounterId" | "facilityId";

/** What the UI edits per type — one entry of `values[0].value`'s array.
 *  The sole such map: the legacy one in `components/Questionnaire/structured/`
 *  went with the legacy fill stack that was its only consumer. */
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: MedicationRequestCreate;
  medication_statement: MedicationStatementRequest;
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  encounter: EncounterEdit;
  appointment: CreateAppointmentQuestion;
  files: FileUploadQuestion;
  /** Widened from a plain `string` to an object row — contract v2's state
   *  core constrains rows to `TRow extends object`
   *  (`structured/core/types.ts:15,41,69`); see `TimeOfDeathRow`'s own doc
   *  comment (`@/types/questionnaire/structuredRows`) for the full reason. */
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
 *  `patientId` is GUARANTEED present for a type whose `subjects` are
 *  patient and/or encounter — which is every core type, so core
 *  definitions only need a one-line guard to narrow it. It is optional
 *  because a PLUGIN type may declare a resource subject
 *  (location/device/facility): the studio lets it be authored there and
 *  the slot renders it, so its `toRequests` must be reachable on a
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
 * One structured type as the registry holds it. Compiles the EDIT LOG, not
 * the displayed rows: `toRequests` gets only what the clinician changed, so
 * an untouched section produces zero requests BY CONSTRUCTION rather than by
 * each type remembering to filter on a dirty flag (P1-14, fixed for every
 * type at once). Each edit's `patch` is a complete row (`StructuredEdit`'s
 * own doc comment, `@/types/questionnaire/structured`), so the differ needs
 * no baseline lookup and `composeBatch` stays pure.
 *
 * `validate` gets BOTH halves because they answer different questions: the
 * PROJECTION answers "is this required section satisfied" (rows the server
 * already had count), while EDITS answer "is what changed well-formed."
 *
 * No `TRow extends object` constraint here (unlike `core/types.ts`'s
 * `EditLog<TRow extends object>`, the internal differ vocabulary): a type's
 * `DataTypeFor<K>` is free to be any shape `StructuredDataMap` names. In
 * practice every row IS an object — `useStructuredRows` itself requires
 * `TRow extends object` (`core/types.ts:15,41,69`; N2 in the Phase 2 plan's
 * Global Constraints), which is why `time_of_death` widened from a bare
 * `string` to `TimeOfDeathRow` rather than staying a counterexample.
 *
 * `contract: 2` is a fixed literal, not a discriminant — every structured
 * type, core or plugin, is on this one contract. The field survives the
 * Phase 5 shim removal as a version tag a future contract bump could read,
 * not as a union member left for anything to branch on: the legacy
 * `buildRequests`/`StructuredTypeDefinitionV1` contract (the whole recorded
 * array, `dirty`-flag filtering — `DiagnosisRequest.dirty`,
 * `MedicationRequestCreate.dirty`) was deleted in the Phase 5
 * legacy-deletion batch alongside the `QuestionTypes` widgets that were its
 * only writers (`docs/superpowers/plans/2026-08-05-final-push.md` Batch E
 * items 3-4).
 *
 * The registry is a total record over `StructuredQuestionType` — adding a
 * member to the union refuses to compile until a definition exists for it
 * (`registry.ts`'s `STRUCTURED_TYPE_REGISTRY`).
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
  /**
   * The runtime guard on an assistant-supplied (or otherwise externally
   * authored) row for THIS type, published from the type's own `model.ts`
   * — spec §6 A2 / `fill/assistant/structuredEditValidation.ts`'s
   * `rowSchemaOf`, which reads this field DUCK-TYPED (it was written before
   * this field existed on this interface; adding the field here is what
   * lets a future reader stop duck-typing, not a requirement for
   * `rowSchemaOf` itself to keep working — it already does). MUST be built
   * with `.strict()` (bare `z.object({...})` silently strips unknown keys
   * instead of failing `safeParse`, defeating "unknown fields rejected").
   * Optional because a plugin type, or a not-yet-migrated core type, may
   * have none yet — `structuredEditValidation.ts`'s own contract is
   * fail-closed (reject the write, not accept unvalidated) when this is
   * absent, never fail-open.
   *
   * Deliberately NOT `z.ZodType<DataTypeFor<K>>` — forcing a zod schema's
   * inferred output to be exactly, structurally identical to the
   * hand-written `DataTypeFor<K>` interface (readonly array variance,
   * optional-vs-`| undefined`, nullable-vs-optional) fights the schema
   * author over things that don't affect runtime validation correctness,
   * for no consumer that actually needs it: `rowSchemaOf`
   * (`fill/assistant/structuredEditValidation.ts`) reads this duck-typed as
   * a bare `z.ZodType` and only ever calls `.safeParse`.
   */
  rowSchema?: z.ZodType;
}
