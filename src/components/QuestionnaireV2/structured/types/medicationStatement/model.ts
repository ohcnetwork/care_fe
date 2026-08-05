import { z } from "zod";

import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { listProjectValues } from "@/components/QuestionnaireV2/structured/shared/listProjectValues";
import {
  periodSchema,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import { makeUpsertToRequests } from "@/components/QuestionnaireV2/structured/shared/upsertToRequests";
import { CodeSchema, type Code } from "@/types/base/code/code";
import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
  type MedicationStatementRead,
  type MedicationStatementRequest,
} from "@/types/emr/medicationStatement";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/** The wire shape is already the row shape — no widening needed. */
export type MedicationStatementRow = MedicationStatementRequest;

/**
 * Assistant write guard: "is this a plausible row", not "is this row
 * complete enough to submit" — completeness is
 * `medicationStatementValidationIssues`' job. `dosage_text` accepts `""`
 * (matching `newMedicationStatementRow`'s seed); `effective_period` uses
 * {@link periodSchema}, whose values are full ISO instants on the wire —
 * the backend rejects a naive datetime (see `periodDateFromInput`).
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
 * A row with a server `id` flips `status` to `"entered_in_error"` and stays
 * on screen; a row that never reached the server is removed outright.
 * `useStructuredRows`' `removeRow` implements this dispatch for any type
 * supplying a `SoftDeleteDescriptor`.
 */
export const MEDICATION_STATEMENT_SOFT_DELETE: SoftDeleteDescriptor<MedicationStatementRow> =
  {
    patch: { status: "entered_in_error" },
    isDeleted: (row) => row.status === "entered_in_error",
  };

/** Server read shape → the fields this question edits. */
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
 * One baseline row per fetched medication statement, keyed by the server id.
 * Callers pass `undefined` (never `[]`) while the list query is loading or
 * errored — an empty array means "the server confirmed zero medications".
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
 * A freshly picked medication: `status` starts `"active"`,
 * `information_source` defaults to PATIENT, `dosage_text` starts blank
 * (required before submit, not before the row can exist). `encounter` is
 * stamped at creation because a row's `patch` must always be the COMPLETE
 * row.
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
 * Reuses a past PRESCRIPTION as a NEW row for this encounter: everything
 * resets to the `newMedicationStatementRow` defaults, keeping only the
 * medication and note — a prescription's dosage/status/period has no
 * matching statement shape. Named for the SOURCE record, since this type's
 * historical selector reads two shapes into one row shape (see
 * {@link toReusedMedicationStatementRow} for the statement half).
 */
export function toReusedRowFromPrescription(
  record: { medication: Code; note?: string },
  encounterId: string,
): MedicationStatementRow {
  return {
    ...newMedicationStatementRow(record.medication, encounterId),
    note: record.note,
  };
}

/**
 * Reuses a historical statement as a NEW row for this encounter: the server
 * id is stripped — keeping it would make the upsert update the original
 * record in place — and `encounter` is re-stamped to the current encounter,
 * like every other creation path here.
 */
export function toReusedMedicationStatementRow(
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
 * A row missing its dosage or period is INVALID, not EMPTY: it stays on
 * screen, projects, and hard-blocks submit via
 * `medicationStatementValidationIssues`, rather than being silently dropped
 * (see {@link listProjectValues} for the shared list contract).
 */
export const projectValues: ProjectValues<MedicationStatementRow> =
  listProjectValues("medication_statement");

/** Unlike the other upsert types, this endpoint also wants the patient in
 *  each datapoint. A row pulled in via the historical selector can carry a
 *  different origin encounter — see `makeUpsertToRequests` for the
 *  re-stamping contract every upsert type shares. */
export const toRequests = makeUpsertToRequests<MedicationStatementRow>({
  type: "medication_statement",
  resource: "medication/statement",
  softDelete: MEDICATION_STATEMENT_SOFT_DELETE,
  decorateRow: (_row, { patientId }) => ({ patient: patientId }),
});

// ---------------------------------------------------------------------------
// effective_period date conversion — the one boundary between the native
// `<input type="date">` (exactly "yyyy-MM-dd") and the wire format.
// The backend parses `start`/`end` as datetimes and rejects a
// naive one ("Start Date must be timezone aware") — a bare "2026-08-01"
// 400s, so every wire value must be a timezone-aware ISO instant.
// ---------------------------------------------------------------------------

/** Wire ISO datetime → the bare date the native input can display. `""` for
 *  `undefined` (an empty input, not an error).
 *
 *  The date is taken off the ISO string rather than rendered from a `Date`,
 *  which would resolve the instant on the BROWSER's clock: the values
 *  reaching here were not necessarily written by this app — pre-existing
 *  rows, fixtures and non-browser writers all carry UTC midnight, which a
 *  local-clock render shows as the day before west of Greenwich. */
export function periodDateForInput(value: string | undefined): string {
  return value ? value.slice(0, 10) : "";
}

/** The native input's bare "yyyy-MM-dd" → a timezone-aware ISO instant
 *  (UTC midnight for that date) the backend accepts.
 *  `undefined` for an empty input (the field was cleared).
 *
 *  The `"T00:00:00.000Z"` suffix is load-bearing on both counts: without a
 *  time the value is naive and the backend 400s, and without the `Z` the
 *  instant lands on the browser's clock, so a clinician west of Greenwich
 *  would store the day BEFORE the one they picked. */
export function periodDateFromInput(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

// ---------------------------------------------------------------------------
// Validation — pure predicates. The definition file is the only place a
// decision here becomes a translated `QuestionValidationError`.
// ---------------------------------------------------------------------------

/** The two field_keys this type's client-side validation ever binds to. */
export const MEDICATION_STATEMENT_FIELD_KEYS = {
  DOSAGE: "dosage_text",
  PERIOD: "effective_period",
} as const;

/** A medication already marked entered-in-error is retracted, not an
 *  incomplete answer — exempt from the dosage/period completeness rules. */
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

/** Only meaningful once a start date exists — callers check
 *  `isPeriodStartMissing` first (see `medicationStatementValidationIssues`). */
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
 * Row-scoped issues derive from EDITS, not the projection: the projection
 * carries no `rowId`, and an untouched baseline row — however incomplete its
 * historical data — must never hard-block a save for a section nobody opened
 * this session. The edit log carries at most one entry per `rowId`, so no
 * last-write-wins resolution is needed here.
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
