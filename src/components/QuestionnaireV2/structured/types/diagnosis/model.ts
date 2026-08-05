import { format } from "date-fns";
import { z } from "zod";

import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { listProjectValues } from "@/components/QuestionnaireV2/structured/shared/listProjectValues";
import {
  onsetSchema,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import { makeUpsertToRequests } from "@/components/QuestionnaireV2/structured/shared/upsertToRequests";
import { CodeSchema, type Code } from "@/types/base/code/code";
import type {
  Diagnosis,
  DiagnosisRequest,
} from "@/types/emr/diagnosis/diagnosis";
import {
  DIAGNOSIS_CATEGORY,
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_SEVERITY,
  DIAGNOSIS_VERIFICATION_STATUS,
} from "@/types/emr/diagnosis/diagnosis";

/** The wire request shape doubles as the editable row shape. */
export type DiagnosisRow = DiagnosisRequest;

/**
 * Assistant write guard. `severity` is `.nullable()` to match
 * `DiagnosisRequest.severity: DiagnosisSeverity | null`. Timestamp fields
 * are read-only pass-through, left as plain optional strings.
 */
export const rowSchema = z
  .object({
    id: z.string().optional(),
    clinical_status: z.enum(DIAGNOSIS_CLINICAL_STATUS),
    verification_status: z.enum(DIAGNOSIS_VERIFICATION_STATUS),
    code: CodeSchema,
    severity: z.enum(DIAGNOSIS_SEVERITY).nullable(),
    onset: onsetSchema.optional(),
    recorded_date: z.string().optional(),
    note: z.string().optional(),
    category: z.enum(DIAGNOSIS_CATEGORY),
    encounter: z.string().min(1),
    created_by: userDisplaySchema.optional(),
    created_date: z.string().optional(),
    updated_date: z.string().optional(),
  })
  .strict();

/**
 * Removing a row that exists on the server flips `verification_status` to
 * `entered_in_error` and keeps it visible; a row that never reached the
 * server is dropped outright. `useStructuredRows` dispatches on this
 * descriptor by row origin.
 */
export const DIAGNOSIS_SOFT_DELETE: SoftDeleteDescriptor<DiagnosisRow> = {
  patch: { verification_status: "entered_in_error" },
  isDeleted: (row) => row.verification_status === "entered_in_error",
};

/**
 * The calendar date an ISO instant was RECORDED on, taken off the string
 * rather than rendered from a `Date`: rendering resolves the instant on the
 * BROWSER's clock, so an onset stored at the server's own offset comes out a
 * day early anywhere west of it. A structured patch always ships the
 * COMPLETE row, so a clinician editing only the severity would write that
 * shifted onset back — this derivation must not depend on where the browser
 * is.
 */
function isoCalendarDate(value: string): string {
  return value.slice(0, 10);
}

/**
 * `onset_datetime` cut down to the bare date the editor's `<input
 * type="date">` speaks. An onset carrying no datetime at all (FHIR allows
 * `onset_age`/`onset_string` alone) drops the KEY rather than storing
 * `""` — `onsetSchema` rejects an empty date, so an `""` here would make
 * every such baseline row unpatchable by the assistant.
 */
function toRowOnset(onset: Diagnosis["onset"]): DiagnosisRow["onset"] {
  if (!onset) return undefined;
  const { onset_datetime, ...rest } = onset;
  if (!onset_datetime) return rest;
  return { ...rest, onset_datetime: isoCalendarDate(onset_datetime) };
}

/**
 * Read shape → the row this question edits. Uses `date-fns` directly —
 * `@/Utils/utils` transitively reads `import.meta.env` via `@careConfig`,
 * undefined under `node --test`.
 */
export function toDiagnosisRow(diagnosis: Diagnosis): DiagnosisRow {
  return {
    id: diagnosis.id,
    code: diagnosis.code,
    clinical_status: diagnosis.clinical_status,
    verification_status: diagnosis.verification_status,
    severity: diagnosis.severity,
    onset: toRowOnset(diagnosis.onset),
    recorded_date: diagnosis.recorded_date,
    category: diagnosis.category,
    note: diagnosis.note,
    encounter: diagnosis.encounter,
    created_by: diagnosis.created_by,
    created_date: diagnosis.created_date,
  };
}

/**
 * Keyed by the server id so `removeRow` distinguishes baseline
 * (soft-delete) from added (annihilate) rows. Callers pass `undefined`,
 * never `[]`, while the fetch is unresolved.
 */
export function toBaselineRows(
  diagnoses: readonly Diagnosis[],
): BaselineRow<DiagnosisRow>[] {
  return diagnoses.map((diagnosis) => ({
    rowId: diagnosis.id,
    row: toDiagnosisRow(diagnosis),
  }));
}

/**
 * New rows default to active/confirmed, severity "moderate", category
 * "encounter_diagnosis", and onset today. Only the historical-record flow can
 * bring in a "chronic_condition" row. `encounter` is set at creation because a
 * row's `patch` must be the complete row.
 */
export function newDiagnosisRow(code: Code, encounterId: string): DiagnosisRow {
  return {
    code,
    clinical_status: "active",
    verification_status: "confirmed",
    severity: "moderate",
    category: "encounter_diagnosis",
    onset: { onset_datetime: format(new Date(), "yyyy-MM-dd") },
    encounter: encounterId,
  };
}

export const projectValues: ProjectValues<DiagnosisRow> =
  listProjectValues("diagnosis");

/** Duplicate-guard key for `findDuplicateCandidates`, which already
 *  excludes soft-deleted (entered_in_error) rows from its seen set. */
export function diagnosisDuplicateKey(row: DiagnosisRow): string | undefined {
  return row.code.code || undefined;
}

function onsetTime(row: DiagnosisRow): number {
  // A missing onset gets a fixed rank (sorts last): the comparator must
  // be pure and deterministic, so no wall-clock fallback.
  return row.onset?.onset_datetime
    ? new Date(row.onset.onset_datetime).getTime()
    : Number.POSITIVE_INFINITY;
}

/**
 * Display-only onset-ascending sort, passed as `displayOrder` to
 * `projectRows`: it reorders the returned `ProjectedRow[]` only. The
 * baseline and edit log — and therefore `toRequests` — never see this
 * order; rows are addressed by `rowId`, never by position.
 */
export function diagnosisDisplayOrder(
  a: DiagnosisRow,
  b: DiagnosisRow,
): number {
  return onsetTime(a) - onsetTime(b);
}

/**
 * Onset is frozen once a row exists on the server — editing a recorded
 * diagnosis's onset would rewrite clinical history. A row re-added from
 * history has its id stripped and is genuinely new, so its onset stays
 * editable.
 */
export function isOnsetFrozen(origin: "baseline" | "added"): boolean {
  return origin === "baseline";
}

/**
 * Reuses a historical diagnosis as a NEW row for this encounter: the
 * server id is stripped — keeping it would make the upsert update the
 * original record in place — a null severity defaults to "moderate", and
 * `encounter` is re-stamped to the current encounter.
 */
export function toReusedDiagnosisRow(
  row: DiagnosisRow,
  encounterId: string,
): DiagnosisRow {
  const { id: _id, ...rest } = row;
  return {
    ...rest,
    severity: rest.severity ?? "moderate",
    encounter: encounterId,
  };
}

/** A historical row carries the encounter it was originally recorded under
 *  — see `makeUpsertToRequests` for the re-stamping contract every upsert
 *  type shares. */
export const toRequests = makeUpsertToRequests<DiagnosisRow>({
  type: "diagnosis",
  resource: "diagnosis",
  softDelete: DIAGNOSIS_SOFT_DELETE,
});
