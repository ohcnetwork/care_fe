import { z } from "zod";

import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { listProjectValues } from "@/components/QuestionnaireV2/structured/shared/listProjectValues";
import { dateOnlyString } from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import { makeUpsertToRequests } from "@/components/QuestionnaireV2/structured/shared/upsertToRequests";
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
 * The calendar date an ISO instant was RECORDED on, taken off the string
 * rather than rendered from a `Date`: rendering resolves the instant on the
 * BROWSER's clock, so a date stored at the server's own offset comes out a
 * day early anywhere west of it. A structured patch always ships the
 * COMPLETE row, so a clinician editing only the criticality would write
 * that shifted date back — this derivation must not depend on where the
 * browser is.
 */
function isoCalendarDate(value: string): string {
  return value.slice(0, 10);
}

/**
 * Read shape → the fields this question edits; `last_occurrence` is cut
 * down to a bare date.
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
      ? isoCalendarDate(allergy.last_occurrence)
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

export const projectValues: ProjectValues<AllergyRow> = listProjectValues(
  "allergy_intolerance",
);

/** The baseline fetch is patient-scoped, so a row can carry a different
 *  encounter than the one being filled — see `makeUpsertToRequests` for the
 *  re-stamping contract every upsert type shares. */
export const toRequests = makeUpsertToRequests<AllergyRow>({
  type: "allergy_intolerance",
  resource: "allergy_intolerance",
  softDelete: ALLERGY_SOFT_DELETE,
});
