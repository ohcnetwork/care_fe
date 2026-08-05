import { format } from "date-fns";
import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import {
  onsetSchema,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import { sanitizeNote } from "@/components/QuestionnaireV2/structured/shared/sanitizeNote";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
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
import type { StructuredEdit } from "@/types/questionnaire/structured";

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
 * Read shape → the row this question edits; `onset.onset_datetime` is cut
 * down to a bare date. Uses `date-fns` directly — `@/Utils/utils`
 * transitively reads `import.meta.env` via `@careConfig`, undefined under
 * `node --test`.
 */
export function toDiagnosisRow(diagnosis: Diagnosis): DiagnosisRow {
  return {
    id: diagnosis.id,
    code: diagnosis.code,
    clinical_status: diagnosis.clinical_status,
    verification_status: diagnosis.verification_status,
    severity: diagnosis.severity,
    onset: diagnosis.onset
      ? {
          ...diagnosis.onset,
          onset_datetime: diagnosis.onset.onset_datetime
            ? format(new Date(diagnosis.onset.onset_datetime), "yyyy-MM-dd")
            : "",
        }
      : undefined,
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

/** Rows are complete from creation — no empty-row filter needed; an
 *  empty list projects to an unanswered section. */
export const projectValues: ProjectValues<DiagnosisRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "diagnosis", value: [...rows] }];

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

/** Kept local rather than importing `definitions/adapt.ts`'s
 *  `sanitizeNote`: `model.ts` must stay React-free for `node --test`, and
 *  adapt.ts imports React. */

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

/**
 * Edit log → at most one POST to the upsert endpoint. An empty edit log
 * yields an empty batch — dirtiness is derived from the log, so untouched
 * baseline rows are never re-sent.
 *
 * `resolveChanges` receives no baseline: the differ only sees the edit
 * log, and the hook's prune effect drops edits for rows the baseline has
 * proven gone before submit. A `removes` entry always carries `.row` when
 * a softDelete descriptor is supplied; the `flatMap` guard honors the
 * shared optional type instead of asserting.
 *
 * `encounter: encounterId` overrides each row's own value on purpose: a
 * historical row carries the encounter it was originally recorded under, so
 * re-stamping attaches it to the current encounter.
 */
export async function toRequests(
  edits: readonly StructuredEdit<DiagnosisRow>[],
  { patientId, encounterId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !encounterId) return [];
  const { creates, updates, removes } = resolveChanges(edits, {
    softDelete: DIAGNOSIS_SOFT_DELETE,
  });
  const rows = [
    ...creates,
    ...updates,
    ...removes.flatMap((entry) => (entry.row ? [entry.row] : [])),
  ];
  if (rows.length === 0) return [];
  return [
    {
      url: `/api/v1/patient/${patientId}/diagnosis/upsert/`,
      method: "POST",
      body: {
        datapoints: rows.map((row) => ({
          ...row,
          note: sanitizeNote(row.note),
          encounter: encounterId,
        })),
      },
      reference_id: structuredReferenceId("diagnosis", questionId),
    },
  ];
}
