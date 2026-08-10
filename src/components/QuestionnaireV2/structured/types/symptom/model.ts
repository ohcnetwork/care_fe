import { format } from "date-fns";

import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { listProjectValues } from "@/components/QuestionnaireV2/structured/shared/listProjectValues";
import { makeUpsertToRequests } from "@/components/QuestionnaireV2/structured/shared/upsertToRequests";
import type { Code } from "@/types/base/code/code";
import type { Symptom, SymptomRequest } from "@/types/emr/symptom/symptom";

/** The wire request shape doubles as the editable row shape. */
export type SymptomRow = SymptomRequest;

/**
 * Removing a row that exists on the server flips `verification_status` to
 * `entered_in_error` and keeps it visible; a row that never reached the
 * server is dropped outright. `useStructuredRows` dispatches on this
 * descriptor by row origin.
 */
export const SYMPTOM_SOFT_DELETE: SoftDeleteDescriptor<SymptomRow> = {
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
 * `""` — `""` is not a valid date value for the input.
 */
function toRowOnset(onset: Symptom["onset"]): SymptomRow["onset"] {
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
export function toSymptomRow(symptom: Symptom): SymptomRow {
  return {
    id: symptom.id,
    code: symptom.code,
    clinical_status: symptom.clinical_status,
    verification_status: symptom.verification_status,
    severity: symptom.severity,
    onset: toRowOnset(symptom.onset),
    recorded_date: symptom.recorded_date,
    note: symptom.note,
    category: symptom.category,
    encounter: symptom.encounter,
    created_date: symptom.created_date,
    updated_date: symptom.updated_date,
    created_by: symptom.created_by,
  };
}

/**
 * Keyed by the server id so `removeRow` distinguishes baseline
 * (soft-delete) from added (annihilate) rows. Callers pass `undefined`,
 * never `[]`, while the fetch is unresolved.
 */
export function toBaselineRows(
  symptoms: readonly Symptom[],
): BaselineRow<SymptomRow>[] {
  return symptoms.map((symptom) => ({
    rowId: symptom.id,
    row: toSymptomRow(symptom),
  }));
}

/** Every symptom this question records is a `problem_list_item`; no
 *  control exposes the field. */
const SYMPTOM_CATEGORY = "problem_list_item";

/**
 * New rows default to active/confirmed, severity "moderate", and onset today.
 * `encounter` is set at creation because a row's `patch` must be the complete
 * row.
 */
export function newSymptomRow(code: Code, encounterId: string): SymptomRow {
  return {
    code,
    clinical_status: "active",
    verification_status: "confirmed",
    severity: "moderate",
    category: SYMPTOM_CATEGORY,
    onset: { onset_datetime: format(new Date(), "yyyy-MM-dd") },
    encounter: encounterId,
  };
}

/** Duplicate-guard key for `findDuplicateCandidates`, which already
 *  excludes soft-deleted (entered_in_error) rows from its seen set. An
 *  empty code yields `undefined`, excluding the row from matching. */
export function symptomDuplicateKey(row: SymptomRow): string | undefined {
  return row.code.code || undefined;
}

export const projectValues: ProjectValues<SymptomRow> =
  listProjectValues("symptom");

/**
 * Reuses a historical symptom as a NEW row for this encounter: the server
 * id is stripped — keeping it would make the upsert update the original
 * record in place — and `encounter` is re-stamped to the current
 * encounter. Every other field carries over unchanged.
 */
export function toReusedSymptomRow(
  row: SymptomRow,
  encounterId: string,
): SymptomRow {
  const { id: _id, ...rest } = row;
  return { ...rest, encounter: encounterId };
}

/** A reused historical symptom can carry another encounter — see
 *  `makeUpsertToRequests` for the re-stamping contract every upsert type
 *  shares. */
export const toRequests = makeUpsertToRequests<SymptomRow>({
  type: "symptom",
  resource: "symptom",
  softDelete: SYMPTOM_SOFT_DELETE,
});
