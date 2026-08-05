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
import type { Symptom, SymptomRequest } from "@/types/emr/symptom/symptom";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
} from "@/types/emr/symptom/symptom";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/** The wire request shape doubles as the editable row shape. */
export type SymptomRow = SymptomRequest;

/**
 * Assistant write guard. `category` stays a bare non-empty string — no
 * exhaustive runtime enum exists for it. Timestamp fields are read-only
 * pass-through, left as plain optional strings.
 */
export const rowSchema = z
  .object({
    id: z.string().optional(),
    clinical_status: z.enum(SYMPTOM_CLINICAL_STATUS),
    verification_status: z.enum(SYMPTOM_VERIFICATION_STATUS),
    code: CodeSchema,
    severity: z.enum(SYMPTOM_SEVERITY),
    onset: onsetSchema.optional(),
    recorded_date: z.string().optional(),
    note: z.string().optional(),
    encounter: z.string().min(1),
    category: z.string().min(1),
    created_date: z.string().optional(),
    updated_date: z.string().optional(),
    created_by: userDisplaySchema.optional(),
  })
  .strict();

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
 * Read shape → the row this question edits; `onset.onset_datetime` is cut
 * down to a bare date. Uses `date-fns` directly — `@/Utils/utils`
 * transitively reads `import.meta.env` via `@careConfig`, undefined under
 * `node --test`.
 */
export function toSymptomRow(symptom: Symptom): SymptomRow {
  return {
    id: symptom.id,
    code: symptom.code,
    clinical_status: symptom.clinical_status,
    verification_status: symptom.verification_status,
    severity: symptom.severity,
    onset: symptom.onset
      ? {
          ...symptom.onset,
          onset_datetime: symptom.onset.onset_datetime
            ? format(new Date(symptom.onset.onset_datetime), "yyyy-MM-dd")
            : "",
        }
      : undefined,
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

/** Rows are complete from creation — no empty-row filter needed; an
 *  empty list projects to an unanswered section. */
export const projectValues: ProjectValues<SymptomRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "symptom", value: [...rows] }];

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

/** Kept local rather than importing `definitions/adapt.ts`'s
 *  `sanitizeNote`: `model.ts` must stay React-free for `node --test`, and
 *  adapt.ts imports React. */

/**
 * Edit log → at most one POST to the upsert endpoint. An empty edit log
 * yields an empty batch — untouched baseline rows are never re-sent, so a
 * concurrent edit to an unrelated symptom cannot be overwritten.
 *
 * `resolveChanges` receives no baseline: the differ only sees the edit
 * log, and the hook's prune effect drops edits for rows the baseline has
 * proven gone before submit. A `removes` entry always carries `.row` when
 * a softDelete descriptor is supplied; the `flatMap` guard honors the
 * shared optional type instead of asserting.
 *
 * `encounter: encounterId` overrides each row's own value on purpose: a reused
 * historical symptom can carry another encounter.
 */
export async function toRequests(
  edits: readonly StructuredEdit<SymptomRow>[],
  { patientId, encounterId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !encounterId) return [];
  const { creates, updates, removes } = resolveChanges(edits, {
    softDelete: SYMPTOM_SOFT_DELETE,
  });
  const rows = [
    ...creates,
    ...updates,
    ...removes.flatMap((entry) => (entry.row ? [entry.row] : [])),
  ];
  if (rows.length === 0) return [];
  return [
    {
      url: `/api/v1/patient/${patientId}/symptom/upsert/`,
      method: "POST",
      body: {
        datapoints: rows.map((row) => ({
          ...row,
          note: sanitizeNote(row.note),
          encounter: encounterId,
        })),
      },
      reference_id: structuredReferenceId("symptom", questionId),
    },
  ];
}
