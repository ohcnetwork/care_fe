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
import type {
  Diagnosis,
  DiagnosisRequest,
} from "@/types/emr/diagnosis/diagnosis";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * The wire shape is already the row shape — no widening needed, so the
 * `diagnosis` arm of `StructuredDataMap` (`structured/types.ts:45`) and the
 * `RV<"diagnosis", DiagnosisRequest[]>` arm of `ResponseValue` are both
 * untouched by this port.
 *
 * `dirty` (now `dirty?: boolean` on `DiagnosisRequest` — see that type's own
 * doc comment) is the ONE field a v2 row is allowed to carry but must NEVER
 * set: every function below (`toDiagnosisRow`, `newDiagnosisRow`,
 * `toRequests`) omits it entirely rather than writing `dirty: false`.
 * Dirtiness is derived from the edit log now (`resolveChanges`, below) —
 * see this module's own header comment for the full argument.
 */
export type DiagnosisRow = DiagnosisRequest;

/**
 * The soft-delete contract this port exists to land (P1-14's other half —
 * the entered-in-error split). Legacy split this by hand at every mutation
 * site (`DiagnosisQuestion.tsx:455-490`, `handleRemoveDiagnosis`): a row
 * WITH a server `id` flips `verification_status` to `entered_in_error` and
 * stays on screen; a row WITHOUT one (never reached the server) is simply
 * dropped. `useStructuredRows`'s `removeRow`/`resolveRemoveIntent`
 * (`core/rowMutations.ts`) already implements exactly this dispatch for ANY
 * type that supplies a `SoftDeleteDescriptor` — configuring this descriptor
 * is the WHOLE fix, mirroring `allergyIntolerance/model.ts`'s
 * `ALLERGY_SOFT_DELETE` one-for-one.
 */
export const DIAGNOSIS_SOFT_DELETE: SoftDeleteDescriptor<DiagnosisRow> = {
  patch: { verification_status: "entered_in_error" },
  isDeleted: (row) => row.verification_status === "entered_in_error",
};

/**
 * `Diagnosis` (the read shape, with `created_by`/`updated_by`/timestamps) →
 * the row this question edits. Exactly `DiagnosisQuestion.tsx`'s
 * `convertToDiagnosisRequest` (`:298-321`), lifted out so it is testable
 * without a DOM and so it never writes `dirty` (the legacy converter wrote
 * `dirty: false`; this omits the key entirely — see `DiagnosisRow`'s own
 * doc comment). `onset.onset_datetime` re-formats from the server's full
 * ISO datetime to a bare date string — `date-fns`'s `format` only (no
 * `@/Utils/utils`/`dateQueryString`: that module imports `@careConfig` at
 * the top, which reads `import.meta.env` and is `undefined` under
 * `node --test` — the identical hazard `allergyIntolerance/model.ts`'s
 * `toAllergyRow` documents for the same reason).
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
 * One baseline row per fetched diagnosis, keyed by the SERVER id — a real
 * identity, so `removeRow` can tell a baseline row (soft-deletes) from an
 * added one (annihilates) by `origin` alone.
 *
 * BASELINE HONESTY (BASELINE COMPLETENESS CONTRACT). Only ever called with a
 * RESOLVED `listDiagnosis` result, so this always returns the COMPLETE
 * server-row set for this question. While the query is loading or errored
 * there is no read to convert — the caller passes `undefined`, never `[]`
 * (`DiagnosisEditor.tsx` does exactly this).
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
 * A freshly picked diagnosis code, seeded exactly the way
 * `DiagnosisQuestion.tsx`'s `DIAGNOSIS_INITIAL_VALUE` does (`:91-99`):
 * `clinical_status` starts `"active"`, `verification_status` starts
 * `"confirmed"`, `severity` defaults to `"moderate"`, `category` is always
 * `"encounter_diagnosis"` for a freshly recorded diagnosis (legacy's own
 * `selectedCategory` state is never reassigned — only the historical-record
 * flow can bring in a `"chronic_condition"` row). `encounter` is baked in
 * here, at creation — unlike the legacy widget, which only attached it at
 * submit time — because a v2 row's `patch` must always be the COMPLETE row.
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

/**
 * A list, not a singleton, and — like `allergy_intolerance`/`charge_item` —
 * a row here is born whole the moment `newDiagnosisRow` creates it from a
 * picked code: there is no "half filled" state to reconcile, so there is no
 * separate `isEmptyRow` predicate to keep in sync with a submission filter
 * (this phase's binding "Lessons from the first ports", #2). Whatever
 * `rows` holds is exactly what the clinician sees and exactly what
 * `toRequests` below compiles requests for.
 */
export const projectValues: ProjectValues<DiagnosisRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "diagnosis", value: [...rows] }];

/**
 * The duplicate-code guard (domain requirement): reproduces
 * `DiagnosisQuestion.tsx`'s `checkForDuplicateDiagnosis` (`:323-343`) as a
 * `duplicateKey` for `structured/core/duplicates.ts`'s
 * `findDuplicateCandidates` — wired into `useStructuredRows({ duplicateKey:
 * diagnosisDuplicateKey })` in the editor, NOT called directly here (the
 * core primitive owns the matching logic; this module only supplies the
 * key). `findDuplicateCandidates` already excludes `softDeleted` rows from
 * the seen set before checking, which is exactly legacy's
 * `verification_status !== "entered_in_error"` half of the same guard — no
 * extra branch needed here to reproduce it.
 */
export function diagnosisDuplicateKey(row: DiagnosisRow): string | undefined {
  return row.code.code || undefined;
}

function onsetTime(row: DiagnosisRow): number {
  // A missing onset sorts LAST, not "now" — legacy's comparator
  // (`DiagnosisQuestion.tsx:369-376`) fell back to `new Date()`, read fresh
  // on every comparison, which is impure and (in principle) capable of
  // reordering mid-sort. `displayOrder` must be a pure `(a, b) => number`
  // (`useStructuredRows`'s own option type), so a missing onset gets a
  // fixed, deterministic rank instead of a wall-clock read — a documented
  // improvement, not a behavior this port needs to reproduce bug-for-bug,
  // since "which end an onset-less row lands on" was never the bug P1's
  // `displayOrder` option exists to fix (the sorted-array WRITE-BACK was).
  return row.onset?.onset_datetime
    ? new Date(row.onset.onset_datetime).getTime()
    : Number.POSITIVE_INFINITY;
}

/**
 * Onset-ascending — reproduces `DiagnosisQuestion.tsx:366-378`'s sort for
 * DISPLAY ONLY. Passed as `useStructuredRows({ displayOrder:
 * diagnosisDisplayOrder })`, which threads it to `projectRows`'
 * `displayOrder` option: the returned `ProjectedRow[]` is reordered, but
 * the `baseline` array and the edit `log` `projectRows` was computed from
 * are provably untouched (`core/projectRows.ts`'s own "Diagnosis bug" test
 * pins this at the core layer; `model.test.ts`'s "DISPLAY-ONLY SORT" case
 * pins it again here, through this exact comparator).
 *
 * THE BUG THIS RETIRES: legacy sorted `sortedDiagnoses` and then WROTE THE
 * SORTED ARRAY BACK as `values[0].value` (`updateQuestionnaireResponseCB`
 * inside `addNewDiagnosis`/`handleUpdateDiagnosis`/`handleRemoveDiagnosis`
 * all persist whatever order `sortedDiagnoses` was already in) — so the
 * PERSISTED order silently became onset order regardless of when each
 * diagnosis was actually recorded. Worse, `patientDiagnoses.results[index]`
 * (`:696-698`, the disabled-row lookup) then indexed that SORTED array
 * against the SERVER's response, which is in `-created_date` order
 * (`diagnosisApi.ts`'s `defaultQueryParams`) — a real desync: row N of the
 * sorted display could read row M's disabled state. `displayOrder` sorts
 * only what the clinician SEES; `edits`/`baseline` (and therefore
 * `toRequests`, which reads only `edits`) never see the sorted order at
 * all, so there is no per-index lookup left to desync in the first place —
 * `useStructuredRows` addresses rows by `rowId`, never by position.
 */
export function diagnosisDisplayOrder(
  a: DiagnosisRow,
  b: DiagnosisRow,
): number {
  return onsetTime(a) - onsetTime(b);
}

/**
 * Onset date is frozen once the row has reached the server — editing a
 * recorded diagnosis's onset after the fact would silently rewrite clinical
 * history. A freshly added row (client-only, no server id yet) may still be
 * corrected before its first save. Mirrors `DiagnosisQuestion.tsx`'s
 * `!!diagnosis.id` gate (`:247`, `:805`), generalized to
 * `ProjectedRow.origin` — the same generalization
 * `RowStatusSelect.isExistingRecord` already makes (`core/types.ts`'s
 * `ProjectedRow.origin` doc comment): a historical diagnosis re-added with
 * its id stripped is genuinely NEW, not "existing," even though it once had
 * a server id under a different encounter.
 */
export function isOnsetFrozen(origin: "baseline" | "added"): boolean {
  return origin === "baseline";
}

/** Mirrors `definitions/adapt.ts`'s `sanitizeNote`, reimplemented locally
 *  rather than imported: `adapt.ts` imports `useCallback` from `react`, and
 *  a `model.ts` must import no React (the unit-test-harness constraint) —
 *  the same reason `allergyIntolerance/model.ts` is self-contained rather
 *  than reaching into `definitions/`. */
function sanitizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}

/**
 * The edit log → at most one POST against the upsert endpoint, carrying
 * every row this session touched.
 *
 * P1-14, LANDED FOR REAL. Today `definitions/diagnosis.tsx`'s old
 * `buildRequests` filtered on the hand-maintained `dirty` flag — every
 * mutation path in `DiagnosisQuestion.tsx` had to remember to set
 * `dirty: true`, and the flag had to be threaded all the way to the wire
 * payload and stripped there. An empty edit log now means an empty batch by
 * CONSTRUCTION: `resolveChanges([], {})` returns three empty sets
 * regardless of how many diagnoses are on record, and this function
 * returns `[]` before ever touching the network — no flag to forget to
 * set, because there is no flag.
 *
 * `resolveChanges(edits, { softDelete: DIAGNOSIS_SOFT_DELETE })` — NO
 * baseline, matching `allergy_intolerance`'s (not `charge_item`'s)
 * reasoning: this type's baseline genuinely EXISTS, but `toRequests(edits,
 * ctx)` structurally never receives it (contract v2's differ takes only
 * the edit log). The live hook already threads the real baseline through
 * every mutator during editing, and its own passive prune effect removes
 * any edit for a rowId the baseline has since proven gone well before a
 * submit ever reaches this function.
 *
 * `creates`/`updates`/`removes` are combined into ONE `datapoints` array,
 * matching the legacy widget's own single-array submit.
 *
 * `encounter: encounterId` OVERRIDES each row's own `encounter` field,
 * unconditionally — INHERITED LEGACY BEHAVIOR, not a new decision made
 * here. `definitions/diagnosis.tsx`'s old `buildRequests` did the same
 * (`...diagnosis, encounter: encounterId`), which matters for a row added
 * through the historical-record selector: that row's `encounter` is
 * whichever encounter it was ORIGINALLY recorded under, and this re-stamp
 * is what attaches it to the CURRENT encounter on submit. Preserved for
 * behavioral parity — revisiting it is out of this port's scope.
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
