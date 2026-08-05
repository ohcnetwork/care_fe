import { format } from "date-fns";
import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { dateOnlyString } from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
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

/**
 * The wire shape is already the row shape — no widening needed, so the
 * `allergy_intolerance` arm of `StructuredDataMap`
 * (`structured/types.ts:41`) and the `RV<"allergy_intolerance",
 * AllergyIntoleranceRequest[]>` arm of `ResponseValue` are both untouched by
 * this port.
 */
export type AllergyRow = AllergyIntoleranceRequest;

/**
 * The assistant write guard (spec §6 A2 — see `timeOfDeath/model.ts`'s
 * `rowSchema` for the full contract). `verification_status` is hand-listed
 * (the type it guards, `AllergyVerificationStatus`, is a plain string
 * union with no backing runtime array to read); `criticality` is
 * `ALLERGY_CRITICALITY`-checked even though `AllergyIntoleranceRequest`
 * itself widens the field to `string` — every real row is one of those
 * three values, and a schema this loose would defeat "enums checked" (spec
 * §6 A2's own wording) for the one field on this row that most needs it.
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
 * The soft-delete contract this port exists to land (P1-14's other half —
 * the entered-in-error split, alongside the zero-upsert differ below).
 * Legacy split this by hand at every mutation site
 * (`AllergyQuestion.tsx:625-656`, `handleRemoveAllergy`): a row WITH a
 * server `id` flips `verification_status` to `entered_in_error` and stays
 * on screen; a row WITHOUT one (never reached the server) is simply
 * dropped. `useStructuredRows`'s `removeRow`/`resolveRemoveIntent`
 * (`core/rowMutations.ts`) already implements exactly this dispatch for
 * ANY type that supplies a `SoftDeleteDescriptor` — a baseline row gets an
 * `update` carrying `patch` merged on top of its current content; an added
 * row gets a `remove`, which `editLog.ts`'s `coalesceOntoAdd` annihilates
 * against the row's own still-pending `add` (the row never reached the
 * server, so removing it returns the log to pristine). Configuring this
 * descriptor is the WHOLE fix — no special-cased branch of my own is needed
 * on top of it.
 */
export const ALLERGY_SOFT_DELETE: SoftDeleteDescriptor<AllergyRow> = {
  patch: { verification_status: "entered_in_error" },
  isDeleted: (row) => row.verification_status === "entered_in_error",
};

/**
 * `AllergyIntolerance` (the read shape, with `created_by`/`edited_by`/
 * timestamps) → the seven fields this question actually edits. Exactly
 * `AllergyQuestion.tsx`'s `convertToAllergyRequest` (`:305-321`), lifted out
 * so it is testable without a DOM. `last_occurrence` re-formats from the
 * server's full ISO datetime to a bare date string — `date-fns`'s `format`
 * only (no `@/Utils/utils`/`dateQueryString`: that module imports
 * `@careConfig` at the top, which reads `import.meta.env` and is
 * `undefined` under `node --test` — see `files/model.ts`'s
 * `FileRequestDeps` doc comment for the identical hazard on the identical
 * import).
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
 * One baseline row per fetched allergy, keyed by the SERVER id — a real
 * identity, unlike `appointment`/`time_of_death`'s `SINGLETON_ROW_ID`, so
 * `removeRow` can tell a baseline row (soft-deletes) from an added one
 * (annihilates) by `origin` alone.
 *
 * BASELINE HONESTY (BASELINE COMPLETENESS CONTRACT). Only ever called with a
 * RESOLVED `getAllergy` result, so this always returns the COMPLETE
 * server-row set for this question. While the query is loading or errored
 * there is no read to convert — the caller passes `undefined`, never `[]`
 * (`AllergyEditor.tsx` does exactly this).
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
 * A freshly picked allergy code, seeded exactly the way
 * `AllergyQuestion.tsx`'s `ALLERGY_INITIAL_VALUE` does
 * (`:83-89`/`:598-608`): `clinical_status` starts `"active"`,
 * `verification_status` starts `"confirmed"` (a clinician who just
 * recorded it is asserting it, not merely suspecting it), `category`
 * defaults to `"medication"` (the historically most common entry) and
 * `criticality` to `"low"`. `encounter` is baked in here, at creation —
 * unlike the legacy widget, which only attached it at submit time
 * (`definitions/allergyIntolerance.tsx`'s old `buildRequests`) — because a
 * v2 row's `patch` must always be the COMPLETE row, and
 * `AllergyIntoleranceRequest.encounter` is a required field, not an
 * optional one this differ can paper over later.
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

/**
 * A list, not a singleton, and — like `charge_item`/`files` — a row here is
 * born whole the moment `newAllergyRow` creates it from a picked code: there
 * is no "half filled" state to reconcile, so there is no separate
 * `isEmptyRow` predicate to keep in sync with a submission filter (Lesson 2,
 * this phase's binding "Lessons from the first ports"). Whatever `rows`
 * holds is exactly what the clinician sees and exactly what `toRequests`
 * below compiles requests for.
 */
export const projectValues: ProjectValues<AllergyRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "allergy_intolerance", value: [...rows] }];

/** Mirrors `definitions/adapt.ts`'s `sanitizeNote`, reimplemented locally
 *  rather than imported: `adapt.ts` imports `useCallback` from `react`, and
 *  a `model.ts` must import no React (N1's unit-test-harness constraint) —
 *  the same reason every other type's `model.ts` is self-contained rather
 *  than reaching into `definitions/`. */
function sanitizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}

/**
 * The edit log → at most one POST against the upsert endpoint, carrying
 * every row this session touched.
 *
 * P1-14, LANDED FOR REAL. Today `definitions/allergyIntolerance.tsx`'s old
 * `buildRequests` mapped over the WHOLE projection — every prefetched
 * allergy, touched or not — so submitting ANY form carrying an allergy
 * question re-sent every allergy back to the server on every save,
 * including one an unrelated concurrent edit had just changed. An empty
 * edit log now means an empty batch, full stop: `resolveChanges([], ...)`
 * returns three empty sets by construction, and this function returns `[]`
 * before ever touching the network.
 *
 * `resolveChanges(edits, { softDelete: ALLERGY_SOFT_DELETE })` — NO
 * baseline, matching `encounter`'s (not `charge_item`'s) reasoning: unlike
 * a create-only type, this type's baseline genuinely EXISTS, but
 * `toRequests(edits, ctx)` structurally never receives it (contract v2's
 * differ takes only the edit log; `composeBatch` is a pure function with no
 * access to the TanStack cache). The live hook already threads the real
 * baseline through every mutator during editing (`AllergyEditor.tsx`), and
 * its own passive prune effect removes any edit for a rowId the baseline
 * has since proven gone well before a submit ever reaches this function —
 * see `useStructuredRows.ts`'s own doc comment on that effect.
 *
 * `creates`/`updates`/`removes` are combined into ONE `datapoints` array,
 * matching the legacy widget's own single-array submit
 * (`definitions/allergyIntolerance.tsx`'s old body). A `removes` entry
 * always carries `.row` here (a `softDelete` descriptor was supplied), but
 * the type keeps it optional (`ResolvedRemove.row?`) for a type with real
 * delete semantics — the `flatMap` guard is what stays honest to that
 * shared type rather than asserting.
 *
 * `encounter: encounterId` OVERRIDES each row's own `encounter` field,
 * unconditionally — INHERITED LEGACY BEHAVIOR, not a new decision made
 * here. The baseline fetch (`allergyIntoleranceApi.getAllergy`) is
 * patient-scoped, not encounter-scoped, so a row can carry a DIFFERENT
 * encounter than the one this session is filling; re-stamping it to the
 * current encounter on every submitted row is exactly what
 * `definitions/allergyIntolerance.tsx`'s old `buildRequests` already did
 * (`...allergy, encounter: encounterId`). Preserved for behavioral parity —
 * fixing it, if it needs fixing, is out of this port's scope.
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
