import type { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import type { SymptomRequest } from "@/types/emr/symptom/symptom";

import type { BaselineRow, RowEdit, RowId } from "./types";

/**
 * Shared fixtures for this directory's tests.
 *
 * The clinical builders (`SymptomRequest`/`DiagnosisRequest`) are the
 * actual row shapes the structured editors compare and project — used
 * wherever a case is shape-sensitive (the soft-delete marker field, the
 * Diagnosis onset-sort bug). The generic edit/baseline builders serve the
 * structural cases; each test file keeps its own small `TestRow`, since
 * those shapes intentionally differ per suite.
 */

export function makeSymptomRow(
  overrides: Partial<SymptomRequest> = {},
): SymptomRequest {
  return {
    id: "symptom-1",
    clinical_status: "active",
    verification_status: "confirmed",
    code: { system: "system-condition-code", code: "R05", display: "Cough" },
    severity: "moderate",
    onset: { onset_datetime: "2026-01-01" },
    recorded_date: "2026-01-01",
    note: "worse at night",
    encounter: "encounter-1",
    category: "problem_list_item",
    ...overrides,
  };
}

export function makeDiagnosisRow(
  overrides: Partial<DiagnosisRequest> = {},
): DiagnosisRequest {
  return {
    id: "diagnosis-1",
    clinical_status: "active",
    verification_status: "confirmed",
    code: { system: "system-condition-code", code: "J45", display: "Asthma" },
    severity: "mild",
    onset: { onset_datetime: "2025-06-01" },
    recorded_date: "2025-06-01",
    note: undefined,
    category: "chronic_condition",
    encounter: "encounter-1",
    ...overrides,
  };
}

export function add<TRow extends object>(
  rowId: RowId,
  patch: TRow,
): RowEdit<TRow> {
  return { rowId, op: "add", patch };
}

export function update<TRow extends object>(
  rowId: RowId,
  patch: TRow,
): RowEdit<TRow> {
  return { rowId, op: "update", patch };
}

export function remove<TRow extends object>(
  rowId: RowId,
  patch: TRow,
): RowEdit<TRow> {
  return { rowId, op: "remove", patch };
}

export function baselineOf<TRow extends object>(
  entries: ReadonlyArray<readonly [RowId, TRow]>,
): ReadonlyMap<RowId, TRow> {
  return new Map(entries);
}

export function baselineEntry<TRow extends object>(
  rowId: RowId,
  row: TRow,
): BaselineRow<TRow> {
  return { rowId, row };
}
