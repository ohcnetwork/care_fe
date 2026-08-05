import { format } from "date-fns";
import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { dateOnlyString } from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import { sanitizeNote } from "@/components/QuestionnaireV2/structured/shared/sanitizeNote";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { CodeSchema, type Code } from "@/types/base/code/code";
import type {
  AllergyIntolerance,
  AllergyIntoleranceRequest,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import {
  ALLERGY_CATEGORY,
  ALLERGY_CLINICAL_STATUS,
  ALLERGY_CRITICALITY,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/** The wire request shape doubles as the editable row shape. */
export type AllergyRow = AllergyIntoleranceRequest;

/**
 * Assistant write guard. `verification_status` values are hand-listed —
 * `AllergyVerificationStatus` is a plain string union with no runtime
 * tuple to read. `criticality` is checked against `ALLERGY_CRITICALITY`
 * even though `AllergyIntoleranceRequest` widens the field to `string`.
 */
export const rowSchema = z
  .object({
    id: z.string().optional(),
    clinical_status: z.enum(ALLERGY_CLINICAL_STATUS),
    verification_status: z.enum([
      "unconfirmed",
      "confirmed",
      "refuted",
      "presumed",
      "entered_in_error",
    ]),
    category: z.enum(ALLERGY_CATEGORY),
    criticality: z.enum(ALLERGY_CRITICALITY),
    code: CodeSchema,
    last_occurrence: dateOnlyString.optional(),
    note: z.string().optional(),
    encounter: z.string().min(1),
  })
  .strict();

/**
 * Removing a row that exists on the server flips `verification_status` to
 * `entered_in_error` and keeps it visible; a row that never reached the
 * server is dropped outright (its pending `add` is annihilated).
 * `useStructuredRows` dispatches on this descriptor by row origin — no
 * type-specific removal branch is needed.
 */
export const ALLERGY_SOFT_DELETE: SoftDeleteDescriptor<AllergyRow> = {
  patch: { verification_status: "entered_in_error" },
  isDeleted: (row) => row.verification_status === "entered_in_error",
};

/**
 * Read shape → the fields this question edits; `last_occurrence` is cut
 * down to a bare date. Uses `date-fns` directly — `@/Utils/utils`
 * transitively reads `import.meta.env` via `@careConfig`, which is
 * undefined under `node --test`.
 */
export function toAllergyRow(allergy: AllergyIntolerance): AllergyRow {
  return {
    id: allergy.id,
    code: allergy.code,
    clinical_status: allergy.clinical_status,
    verification_status: allergy.verification_status,
    category: allergy.category,
    criticality: allergy.criticality,
    last_occurrence: allergy.last_occurrence
      ? format(new Date(allergy.last_occurrence), "yyyy-MM-dd")
      : undefined,
    note: allergy.note,
    encounter: allergy.encounter,
  };
}

/**
 * Keyed by the server id so `removeRow` distinguishes baseline
 * (soft-delete) from added (annihilate) rows. Callers pass `undefined`,
 * never `[]`, while the fetch is unresolved — an empty array asserts the
 * server returned zero allergies.
 */
export function toBaselineRows(
  allergies: readonly AllergyIntolerance[],
): BaselineRow<AllergyRow>[] {
  return allergies.map((allergy) => ({
    rowId: allergy.id,
    row: toAllergyRow(allergy),
  }));
}

/**
 * New rows default to active/confirmed, category "medication", and criticality
 * "low". `encounter` is set at creation because a row's `patch` must be the
 * complete row and the field is required on the wire shape.
 */
export function newAllergyRow(code: Code, encounterId: string): AllergyRow {
  return {
    code,
    clinical_status: "active",
    verification_status: "confirmed",
    category: "medication",
    criticality: "low",
    encounter: encounterId,
  };
}

/** Rows are complete from creation — no empty-row filter needed; an
 *  empty list projects to an unanswered section. */
export const projectValues: ProjectValues<AllergyRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "allergy_intolerance", value: [...rows] }];

/** Kept local rather than importing `definitions/adapt.ts`'s
 *  `sanitizeNote`: `model.ts` must stay React-free for `node --test`, and
 *  adapt.ts imports React. */

/**
 * Edit log → at most one POST to the upsert endpoint. An empty edit log
 * yields an empty batch — untouched baseline rows are never re-sent, so a
 * concurrent edit to an unrelated allergy cannot be overwritten.
 *
 * `resolveChanges` receives no baseline: the differ only sees the edit
 * log, and the hook's prune effect drops edits for rows the baseline has
 * proven gone before submit reaches here. A `removes` entry always
 * carries `.row` when a softDelete descriptor is supplied; the `flatMap`
 * guard honors the shared optional type instead of asserting.
 *
 * `encounter: encounterId` overrides each row's own value on purpose: the
 * baseline fetch is patient-scoped, so a row can carry a different encounter.
 */
export async function toRequests(
  edits: readonly StructuredEdit<AllergyRow>[],
  { patientId, encounterId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !encounterId) return [];
  const { creates, updates, removes } = resolveChanges(edits, {
    softDelete: ALLERGY_SOFT_DELETE,
  });
  const rows = [
    ...creates,
    ...updates,
    ...removes.flatMap((entry) => (entry.row ? [entry.row] : [])),
  ];
  if (rows.length === 0) return [];
  return [
    {
      url: `/api/v1/patient/${patientId}/allergy_intolerance/upsert/`,
      method: "POST",
      body: {
        datapoints: rows.map((row) => ({
          ...row,
          note: sanitizeNote(row.note),
          encounter: encounterId,
        })),
      },
      reference_id: structuredReferenceId("allergy_intolerance", questionId),
    },
  ];
}
