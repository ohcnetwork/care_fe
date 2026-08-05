import { format } from "date-fns";
import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import {
  periodSchema,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { CodeSchema, type Code } from "@/types/base/code/code";
import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
  type MedicationStatementRead,
  type MedicationStatementRequest,
} from "@/types/emr/medicationStatement";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * The wire shape is already the row shape — no widening needed, so the
 * `medication_statement` arm of `StructuredDataMap`
 * (`structured/types.ts:43`) and the `RV<"medication_statement",
 * MedicationStatementRequest[]>` arm of `ResponseValue` (`types/questionnaire
 * /form.ts:37`) are both untouched by this port.
 */
export type MedicationStatementRow = MedicationStatementRequest;

/**
 * The assistant write guard (spec §6 A2 — see `timeOfDeath/model.ts`'s
 * `rowSchema` for the full contract). `dosage_text` accepts an empty
 * string on purpose (matching `newMedicationStatementRow`'s own `""` seed
 * and this type's own completeness decision, `isDosageMissing` — a schema
 * this strict is "is this a plausible row", not "is this row complete
 * enough to submit"; the latter is `medicationStatementValidationIssues`'
 * job, below). `effective_period` is {@link periodSchema} — the SAME
 * timezone-aware-instant shape `periodDateFromInput`'s own doc comment
 * documents the backend actually requires (a bare date-only string 400s).
 */
export const rowSchema = z
  .object({
    id: z.string().optional(),
    status: z.enum(MEDICATION_STATEMENT_STATUS),
    reason: z.string().optional(),
    medication: CodeSchema,
    encounter: z.string().optional(),
    dosage_text: z.string(),
    effective_period: periodSchema.optional(),
    information_source: z.enum(MedicationStatementInformationSourceType),
    note: z.string().optional(),
    created_by: userDisplaySchema.optional(),
  })
  .strict();

/**
 * The soft-delete contract (P1-14's other half, alongside the zero-upsert
 * differ below) — identical shape to `allergy_intolerance`'s
 * `ALLERGY_SOFT_DELETE`. Legacy split this by hand at
 * `MedicationStatementQuestion.tsx`'s `confirmRemoveMedication` (`:259-285`):
 * a row WITH a server `id` flips `status` to `"entered_in_error"` and stays
 * on screen; a row WITHOUT one (never reached the server) is filtered out
 * entirely. `useStructuredRows`'s `removeRow`/`resolveRemoveIntent`
 * (`core/rowMutations.ts`) already implements exactly this dispatch for any
 * type that supplies a `SoftDeleteDescriptor` — no special-cased branch of
 * this port's own is needed on top of it.
 */
export const MEDICATION_STATEMENT_SOFT_DELETE: SoftDeleteDescriptor<MedicationStatementRow> =
  {
    patch: { status: "entered_in_error" },
    isDeleted: (row) => row.status === "entered_in_error",
  };

/**
 * `MedicationStatementRead` (the server read shape, with `created_date`/
 * `modified_date`/`created_by`/`updated_by`) → the fields this question
 * actually edits. Lifted out of `MedicationStatementQuestion.tsx`'s implicit
 * read→request coercion (the legacy widget reads straight off
 * `patientMedications.results`, which is already `MedicationStatementRead[]`,
 * and treats it as `MedicationStatementRequest[]` structurally) so the
 * conversion is explicit and testable without a DOM.
 */
export function toMedicationStatementRow(
  medication: MedicationStatementRead,
): MedicationStatementRow {
  return {
    id: medication.id,
    status: medication.status,
    reason: medication.reason,
    medication: medication.medication,
    dosage_text: medication.dosage_text,
    effective_period: medication.effective_period,
    encounter: medication.encounter,
    information_source: medication.information_source,
    note: medication.note,
  };
}

/**
 * One baseline row per fetched medication statement, keyed by the SERVER
 * id — a real identity, unlike a create-only singleton's fixed row id, so
 * `removeRow` can tell a baseline row (soft-deletes) from an added one
 * (annihilates) by `origin` alone.
 *
 * BASELINE HONESTY (BASELINE COMPLETENESS CONTRACT). Only ever called with a
 * RESOLVED `medicationStatementApi.list` result, so this always returns the
 * COMPLETE server-row set for this question. While the query is loading or
 * errored there is no read to convert — the caller passes `undefined`, never
 * `[]` (`MedicationStatementEditor.tsx` does exactly this).
 */
export function toBaselineRows(
  medications: readonly MedicationStatementRead[],
): BaselineRow<MedicationStatementRow>[] {
  return medications.map((medication) => ({
    rowId: medication.id,
    row: toMedicationStatementRow(medication),
  }));
}

/**
 * A freshly picked medication, seeded exactly the way
 * `MedicationStatementQuestion.tsx`'s `MEDICATION_STATEMENT_INITIAL_VALUE`
 * does (`:89-101`): `status` starts `"active"`, `information_source`
 * defaults to `PATIENT` (the historically most common entry), `dosage_text`
 * starts blank (required before submit, not before the row can exist —
 * see the validation section below). `encounter` is baked in here, at
 * creation — matching `newAllergyRow`'s reasoning, not the legacy widget's
 * (which only attached it at submit time): a v2 row's `patch` must always
 * be the COMPLETE row.
 */
export function newMedicationStatementRow(
  medication: Code,
  encounterId: string,
): MedicationStatementRow {
  return {
    status: "active",
    medication,
    dosage_text: "",
    information_source: MedicationStatementInformationSourceType.PATIENT,
    encounter: encounterId,
  };
}

/**
 * Converts one `MedicationHistory` selection (`HistoricalRecordSelector`'s
 * two source types) into a fresh row. Two distinct shapes, per legacy's own
 * `handleAddHistoricalMedications` (`MedicationStatementQuestion.tsx:224-253`):
 *
 *  - a past PRESCRIPTION (`MedicationRequestRead`) resets to the same
 *    defaults `newMedicationStatementRow` uses, keeping only the medication
 *    and its note — a prescription's dosage/status/period do not carry a
 *    matching statement shape at all;
 *  - a past STATEMENT (`MedicationStatementRead`) keeps everything BUT the
 *    server id (this is a NEW row — legacy's `const { id: _id, ...statement
 *    }` strip, `:238`) and is re-stamped to the CURRENT encounter, matching
 *    every other creation path in this module (`newMedicationStatementRow`,
 *    `toRequests`'s own unconditional re-stamp at submit time).
 */
export function fromHistoricalMedicationRequest(
  record: { medication: Code; note?: string },
  encounterId: string,
): MedicationStatementRow {
  return {
    ...newMedicationStatementRow(record.medication, encounterId),
    note: record.note,
  };
}

export function fromHistoricalMedicationStatement(
  record: MedicationStatementRead,
  encounterId: string,
): MedicationStatementRow {
  return {
    status: record.status,
    reason: record.reason,
    medication: record.medication,
    dosage_text: record.dosage_text,
    effective_period: record.effective_period,
    information_source: record.information_source,
    note: record.note,
    encounter: encounterId,
  };
}

/**
 * A list, not a singleton, and — like `allergy_intolerance` — a row here is
 * born whole the moment `newMedicationStatementRow`/`fromHistorical*`
 * creates it: there is no "half filled" state to reconcile, so there is no
 * separate `isEmptyRow` predicate to keep in sync with a submission filter
 * (Lesson 2, binding "Lessons from the first ports"). A row missing its
 * dosage or period is INVALID, not EMPTY — it stays on screen, projects, and
 * hard-blocks submit via `medicationStatementValidationIssues` below, rather
 * than being silently dropped the way an emptied `appointment` singleton is.
 */
export const projectValues: ProjectValues<MedicationStatementRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "medication_statement", value: [...rows] }];

/** Mirrors `definitions/adapt.ts`'s `sanitizeNote` / `allergyIntolerance/
 *  model.ts`'s own copy, reimplemented locally rather than imported: a
 *  `model.ts` must import no React (N1's unit-test-harness constraint), and
 *  `adapt.ts` imports `useCallback`. */
function sanitizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}

/**
 * The edit log → at most one POST against the upsert endpoint, carrying
 * every row this session touched.
 *
 * P1-14, LANDED FOR REAL. Today `definitions/medicationStatement.tsx`'s old
 * `buildRequests` mapped over the WHOLE projection — every prefetched
 * medication, touched or not — so submitting ANY form carrying a medication
 * statement question re-sent every recorded medication back to the server
 * on every save, including one an unrelated concurrent edit had just
 * changed. An empty edit log now means an empty batch, full stop:
 * `resolveChanges([], ...)` returns three empty sets by construction, and
 * this function returns `[]` before ever touching the network.
 *
 * `resolveChanges(edits, { softDelete: MEDICATION_STATEMENT_SOFT_DELETE })`
 * — NO baseline, matching `allergy_intolerance`'s reasoning: this type's
 * baseline genuinely EXISTS, but `toRequests(edits, ctx)` structurally never
 * receives it (contract v2's differ takes only the edit log). The live hook
 * threads the real baseline through every mutator during editing
 * (`MedicationStatementEditor.tsx`), and its own passive prune effect
 * removes any edit for a rowId the baseline has since proven gone well
 * before a submit ever reaches this function.
 *
 * `creates`/`updates`/`removes` are combined into ONE `datapoints` array,
 * matching the legacy widget's own single-array submit
 * (`definitions/medicationStatement.tsx`'s old body). A `removes` entry
 * always carries `.row` here (a `softDelete` descriptor was supplied), but
 * the type keeps it optional (`ResolvedRemove.row?`) for a type with real
 * delete semantics — the `flatMap` guard is what stays honest to that
 * shared type rather than asserting.
 *
 * `encounter`/`patient` are OVERRIDDEN unconditionally on every submitted
 * row — INHERITED LEGACY BEHAVIOR (`definitions/medicationStatement.tsx`'s
 * old body: `...medication, encounter: encounterId, patient: patientId`),
 * not a new decision made here: a row pulled in via the historical selector
 * can carry a different origin encounter, and every submitted row is
 * re-stamped to the CURRENT one regardless.
 */
export async function toRequests(
  edits: readonly StructuredEdit<MedicationStatementRow>[],
  { patientId, encounterId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !encounterId) return [];
  const { creates, updates, removes } = resolveChanges(edits, {
    softDelete: MEDICATION_STATEMENT_SOFT_DELETE,
  });
  const rows = [
    ...creates,
    ...updates,
    ...removes.flatMap((entry) => (entry.row ? [entry.row] : [])),
  ];
  if (rows.length === 0) return [];
  return [
    {
      url: `/api/v1/patient/${patientId}/medication/statement/upsert/`,
      method: "POST",
      body: {
        datapoints: rows.map((row) => ({
          ...row,
          note: sanitizeNote(row.note),
          encounter: encounterId,
          patient: patientId,
        })),
      },
      reference_id: structuredReferenceId("medication_statement", questionId),
    },
  ];
}

// ---------------------------------------------------------------------------
// effective_period date conversion — the ONE boundary between the native
// `<input type="date">` the editor uses (required: exactly "yyyy-MM-dd") and
// the wire format `effective_period.start`/`.end` actually needs.
//
// FOUND BY MOUNT-TESTING (not assumed): the backend's `PeriodSpec`
// (`care/emr/resources/base.py`'s `validate_period`) parses `start`/`end` as
// `datetime.datetime` and REJECTS a naive one — a bare "2026-08-01" parses
// to midnight with no offset and 400s with "Start Date must be timezone
// aware". Legacy's `CombinedDatePicker` sidestepped this by writing
// `date.toISOString()` (`MedicationStatementQuestion.tsx:912`, always
// timezone-aware); `allergy_intolerance`'s bare-`"yyyy-MM-dd"` `last_occurrence`
// precedent does NOT generalize here — that field's backend model accepts a
// date-only string. Confirmed live: a native date input writing its bare
// value straight through 400'd on save; converting through
// `periodDateFromInput` below fixed it, verified by a second live save.
// ---------------------------------------------------------------------------

/** Wire ISO datetime → the bare date the native input can display. `""` for
 *  `undefined` (an empty input, not an error). */
export function periodDateForInput(value: string | undefined): string {
  return value ? format(new Date(value), "yyyy-MM-dd") : "";
}

/** The native input's bare "yyyy-MM-dd" → a timezone-aware ISO instant
 *  (UTC midnight for that date) the backend's `PeriodSpec` accepts.
 *  `undefined` for an empty input (the field was cleared). */
export function periodDateFromInput(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

// ---------------------------------------------------------------------------
// Validation — pure predicates. `model.ts` imports no i18next (matching
// `appointment/model.ts`'s `needsSlot`): the DEFINITION file
// (`definitions/medicationStatement.tsx`) is the one and only place a
// decision here becomes a translated `QuestionValidationError`.
// ---------------------------------------------------------------------------

/** The two field_keys this type's client-side validation ever binds to —
 *  exactly `MEDICATION_STATEMENT_FIELDS`'s two keys in the legacy validator
 *  stack this replaces (`validation.ts`'s `FieldDefinitions`,
 *  `MedicationStatementQuestion.tsx:103-128`). */
export const MEDICATION_STATEMENT_FIELD_KEYS = {
  DOSAGE: "dosage_text",
  PERIOD: "effective_period",
} as const;

/** Mirrors `validateMedicationStatementQuestion`'s own skip
 *  (`MedicationStatementQuestion.tsx:136`): a medication already marked
 *  entered-in-error is retracted, not an incomplete answer, so it is exempt
 *  from the dosage/period completeness rules below. */
export function needsMedicationValidation(
  row: MedicationStatementRow,
): boolean {
  return row.status !== "entered_in_error";
}

export function isDosageMissing(row: MedicationStatementRow): boolean {
  return !row.dosage_text?.trim();
}

export function isPeriodStartMissing(row: MedicationStatementRow): boolean {
  return !row.effective_period?.start;
}

/** Mirrors `MEDICATION_STATEMENT_FIELDS.PERIOD.validate`
 *  (`MedicationStatementQuestion.tsx:117-122`): only meaningful once a start
 *  date exists — `isPeriodStartMissing` is the prior, more specific check,
 *  so a caller runs this only when a start IS present (see
 *  `medicationStatementValidationIssues` below). */
export function isPeriodRangeInvalid(row: MedicationStatementRow): boolean {
  const { start, end } = row.effective_period ?? {};
  if (!start || !end) return false;
  return new Date(end) < new Date(start);
}

export type MedicationStatementValidationReason =
  "missing_dosage" | "missing_period_start" | "invalid_period_range";

export interface MedicationStatementValidationIssue {
  rowId: string;
  fieldKey: (typeof MEDICATION_STATEMENT_FIELD_KEYS)[keyof typeof MEDICATION_STATEMENT_FIELD_KEYS];
  reason: MedicationStatementValidationReason;
}

/**
 * Row-scoped validation issues, derived from EDITS, not the projection
 * (Global Constraint N5): `validate(projection, edits, questionId, required)`
 * receives the projection as bare rows with no `rowId`, so a `row_id`-keyed
 * error must be derived from `edits`, whose `patch` is the complete row —
 * exactly `charge_item/model.ts`'s `invalidQuantityRowIds` reasoning. This
 * also means an UNTOUCHED baseline row (however incomplete its historical
 * dosage/period data) never hard-blocks a save for a section nobody opened
 * this session — the validation-side twin of P1-14's zero-request
 * guarantee above: only a row the clinician actually touched can gate
 * submit.
 *
 * `edits` here is `structuredEditsOf(response)` (`fill/submit/
 * validateStructured.ts`) — the hook's own committed log, which
 * `applyEditToLog` guarantees carries at most one entry per `rowId` — so no
 * additional last-write-wins resolution is needed here (unlike
 * `resolveChanges`, which also has to defend against an untrusted restored
 * draft's per-record validation admitting duplicates).
 */
export function medicationStatementValidationIssues(
  edits: readonly StructuredEdit<MedicationStatementRow>[],
): MedicationStatementValidationIssue[] {
  const issues: MedicationStatementValidationIssue[] = [];
  for (const edit of edits) {
    if (edit.op === "remove") continue;
    const row = edit.patch;
    if (!needsMedicationValidation(row)) continue;

    if (isDosageMissing(row)) {
      issues.push({
        rowId: edit.rowId,
        fieldKey: MEDICATION_STATEMENT_FIELD_KEYS.DOSAGE,
        reason: "missing_dosage",
      });
    }

    if (isPeriodStartMissing(row)) {
      issues.push({
        rowId: edit.rowId,
        fieldKey: MEDICATION_STATEMENT_FIELD_KEYS.PERIOD,
        reason: "missing_period_start",
      });
    } else if (isPeriodRangeInvalid(row)) {
      issues.push({
        rowId: edit.rowId,
        fieldKey: MEDICATION_STATEMENT_FIELD_KEYS.PERIOD,
        reason: "invalid_period_range",
      });
    }
  }
  return issues;
}
