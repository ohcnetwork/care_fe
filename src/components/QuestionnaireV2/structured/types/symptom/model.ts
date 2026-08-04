import { format } from "date-fns";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type { Code } from "@/types/base/code/code";
import type { Symptom, SymptomRequest } from "@/types/emr/symptom/symptom";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * The wire shape is already the row shape — mirrors `allergy_intolerance`'s
 * `AllergyRow`: `symptom` in `StructuredDataMap` (`structured/types.ts:44`)
 * is already `SymptomRequest`, so no widening is needed for this port.
 */
export type SymptomRow = SymptomRequest;

/**
 * P1-14's other half for this type — the entered-in-error soft-delete
 * split. Legacy did this by hand at `SymptomQuestion.tsx:736-757`
 * (`handleRemoveSymptom`): a row WITH a server `id` flips
 * `verification_status` to `entered_in_error` and stays visible; a row
 * WITHOUT one is filtered out entirely. `useStructuredRows`'s
 * `removeRow`/`resolveRemoveIntent` already implements exactly this dispatch
 * for any type that supplies this descriptor — nothing type-specific is
 * needed on top of it.
 */
export const SYMPTOM_SOFT_DELETE: SoftDeleteDescriptor<SymptomRow> = {
  patch: { verification_status: "entered_in_error" },
  isDeleted: (row) => row.verification_status === "entered_in_error",
};

/**
 * `Symptom` (the read shape) → the row this question edits. Exactly
 * `SymptomQuestion.tsx`'s `convertToSymptomRequest` (`:202-225`), lifted out
 * so it is testable without a DOM. `onset.onset_datetime` re-formats from
 * the server's full ISO datetime to a bare date string — `date-fns`'s
 * `format` only, never `@/Utils/utils`'s `dateQueryString`: that module
 * imports `@careConfig` at its top, which reads `import.meta.env` and is
 * `undefined` under `node --test` (the identical hazard `allergyIntolerance/
 * model.ts`'s doc comment names, and `files/model.ts`'s `FileRequestDeps`
 * before it).
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
 * One baseline row per fetched symptom, keyed by the SERVER id — a real
 * identity (unlike `appointment`/`time_of_death`'s `SINGLETON_ROW_ID`), so
 * `removeRow` can tell a baseline row (soft-deletes) from an added one
 * (annihilates) by `origin` alone.
 *
 * BASELINE HONESTY (BASELINE COMPLETENESS CONTRACT). Only ever called with a
 * RESOLVED `listSymptoms` result for THIS encounter — see `SymptomEditor.tsx`'s
 * `useSymptomBaseline`, which passes `undefined` (never `[]`) while the
 * query is loading or errored.
 */
export function toBaselineRows(
  symptoms: readonly Symptom[],
): BaselineRow<SymptomRow>[] {
  return symptoms.map((symptom) => ({
    rowId: symptom.id,
    row: toSymptomRow(symptom),
  }));
}

/** Every symptom this question records is a `problem_list_item` — legacy
 *  bakes this in too (`SYMPTOM_INITIAL_VALUE.category`, `SymptomQuestion.tsx:94`)
 *  and never exposes a control to change it. */
const SYMPTOM_CATEGORY = "problem_list_item";

/**
 * A freshly picked symptom code, seeded exactly the way
 * `SymptomQuestion.tsx`'s `SYMPTOM_INITIAL_VALUE` does (`:89-96`):
 * `clinical_status` starts `"active"`, `verification_status` starts
 * `"confirmed"`, `severity` defaults to `"moderate"`, `onset.onset_datetime`
 * defaults to TODAY (per this port's brief — matches legacy's
 * `dateQueryString(new Date())` seed at `:664`/`:702`/`:727`). `encounter`
 * is baked in here, at creation — unlike legacy, which only attached it at
 * submit time — because a v2 row's `patch` must always be the COMPLETE row.
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

/**
 * The duplicate-code guard this port exists to land on `core/duplicates.ts`
 * rather than reimplement: `checkForDuplicateSymptom`
 * (`SymptomQuestion.tsx:628-647`) compared `symptom.code.code === codeValue`
 * against every NON-`entered_in_error` symptom already in the list. Wired as
 * `useStructuredRows`'s `duplicateKey` option, `findDuplicateCandidates`
 * (`core/duplicates.ts`) reproduces both halves of that rule for free: it
 * seeds its seen-set only from non-`softDeleted` rows (the
 * `verification_status !== "entered_in_error"` exclusion, generalized), and
 * checks candidates against it incrementally. No branching of this port's
 * own is needed on top of it — `SymptomEditor.tsx` only has to surface the
 * toast when `addRow`/`addRows` reports a rejection.
 */
export function symptomDuplicateKey(row: SymptomRow): string | undefined {
  return row.code.code;
}

/**
 * A list, not a singleton — like `allergy_intolerance`, a row here is born
 * whole the moment `newSymptomRow` creates it from a picked code, so there
 * is no separate `isEmptyRow` predicate to keep in sync with a submission
 * filter (Lesson 2). Whatever `rows` holds is exactly what the clinician
 * sees and exactly what `toRequests` below compiles requests for.
 */
export const projectValues: ProjectValues<SymptomRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "symptom", value: [...rows] }];

/**
 * Reusing a historical symptom (`HistoricalRecordSelector`'s
 * `onAddSelected`) as a NEW row for this encounter. Mirrors
 * `SymptomQuestion.tsx:786`'s `({ id: _id, ...symptom }) => symptom`
 * EXACTLY on the one field that matters for correctness: the source
 * record's server `id` is stripped, because keeping it would make this
 * type's upsert endpoint UPDATE the original historical record in place
 * instead of creating a genuinely new one for this encounter — the same
 * silent-corruption shape `core/changes.ts`'s "an `add` colliding with
 * baseline" doc comment warns about, just reached from the type side
 * instead of the differ side. `encounter` is re-stamped to the CURRENT
 * encounter (a deliberate, harmless improvement over legacy, which left the
 * historical row's own `encounter` field untouched client-side and relied
 * on `toRequests`' unconditional override at submit time — still true
 * here, this just keeps the client-side row honest too). Every other field
 * (severity, clinical/verification status, onset, note, category) carries
 * over unchanged, matching legacy.
 */
export function toReusedSymptomRow(
  row: SymptomRow,
  encounterId: string,
): SymptomRow {
  const { id: _id, ...rest } = row;
  return { ...rest, encounter: encounterId };
}

/** Mirrors `definitions/adapt.ts`'s `sanitizeNote`, reimplemented locally —
 *  `adapt.ts` imports `useCallback` from `react`, and a `model.ts` must
 *  import no React (N1's unit-test-harness constraint), the same reason
 *  `allergyIntolerance/model.ts` reimplements it too. */
function sanitizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}

/**
 * The edit log → at most one POST against the upsert endpoint, carrying
 * every row this session touched.
 *
 * P1-14, LANDED FOR REAL. Today `definitions/symptom.tsx`'s v1
 * `buildRequests` maps over the WHOLE projection — every symptom fetched
 * for this encounter, touched or not — so submitting ANY form carrying a
 * symptom question re-sends every symptom back to the server on every
 * save, including one an unrelated concurrent edit just changed. An empty
 * edit log now means an empty batch, full stop: `resolveChanges([], ...)`
 * returns three empty sets by construction, and this function returns `[]`
 * before ever touching the network.
 *
 * `resolveChanges(edits, { softDelete: SYMPTOM_SOFT_DELETE })` — NO
 * baseline, matching `allergy_intolerance`'s (not `charge_item`'s)
 * reasoning: this type's baseline genuinely EXISTS, but `toRequests(edits,
 * ctx)` structurally never receives it — `composeBatch` is a pure function
 * with no access to the TanStack cache. `useStructuredRows` already threads
 * the real baseline through every mutator during editing
 * (`SymptomEditor.tsx`), and its own passive prune effect removes any edit
 * for a rowId the baseline has since proven gone well before a submit ever
 * reaches this function.
 *
 * `creates`/`updates`/`removes` are combined into ONE `datapoints` array,
 * matching legacy's own single-array submit
 * (`definitions/symptom.tsx`'s v1 body). A `removes` entry always carries
 * `.row` here (a `softDelete` descriptor was supplied), but the type keeps
 * it optional (`ResolvedRemove.row?`) for a type with real delete
 * semantics — the `flatMap` guard is what stays honest to that shared type
 * rather than asserting.
 *
 * `encounter: encounterId` OVERRIDES each row's own `encounter` field,
 * unconditionally — INHERITED LEGACY BEHAVIOR (`definitions/symptom.tsx`'s
 * v1 `...symptom, encounter: encounterId`), not a new decision made here.
 * A row can carry a different encounter than the one this session is
 * filling (a historical symptom reused from another encounter,
 * `toReusedSymptomRow` above); re-stamping it to the current encounter on
 * every submitted row preserves behavioral parity — fixing it, if it needs
 * fixing, is out of this port's scope.
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
