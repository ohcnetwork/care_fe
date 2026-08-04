import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
} from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import {
  EncounterStatus,
  type EncounterClass,
  type EncounterDischargeDisposition,
  type EncounterEdit,
  type EncounterRead,
} from "@/types/emr/encounter/encounter";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * The wire shape is already the row shape, so the `encounter` arm of
 * `StructuredDataMap` (`structured/types.ts`) and the `RV<"encounter",
 * EncounterEdit[]>` arm of `ResponseValue` are both untouched by this port.
 *
 * Note what this type does NOT have: an `id`. `EncounterEdit =
 * EncounterBase` (`types/emr/encounter/encounter.ts:211-219,259`) carries
 * no identity of its own, because the only endpoint that consumes it is
 * URL-keyed (`PUT /api/v1/encounter/{id}/`). That single fact drives three
 * decisions below — {@link toBaselineRows}'s rowId, {@link toRequests}'
 * identity filter, and why an `add` and an `update` compile to the same
 * request.
 */
export type EncounterRow = EncounterEdit;

/** Statuses that END an encounter, and therefore want a `period.end`.
 *  Exactly the five the legacy status effect listed
 *  (`EncounterQuestion.tsx:136-141`). */
const TERMINAL_STATUSES: ReadonlySet<EncounterStatus> = new Set([
  EncounterStatus.DISCHARGED,
  EncounterStatus.COMPLETED,
  EncounterStatus.CANCELLED,
  EncounterStatus.DISCONTINUED,
  EncounterStatus.ENTERED_IN_ERROR,
]);

/** Classes with no hospitalization record at all (`EncounterQuestion.tsx:200`). */
const AMBULATORY_CLASSES: readonly EncounterClass[] = ["amb", "vr", "hh"];

/** Classes that DO carry one, and therefore need a discharge disposition
 *  once discharged (`EncounterQuestion.tsx:82,205,382`). */
const HOSPITALIZED_CLASSES: readonly EncounterClass[] = [
  "imp",
  "obsenc",
  "emer",
];

/**
 * Does this class carry a hospitalization record? The single authority for
 * the `["imp", "obsenc", "emer"].includes(...)` literal that appears FOUR
 * times in the legacy widget (`EncounterQuestion.tsx:82,205,382` and the
 * disposition panel's own gate) — the editor's hospitalization panel, this
 * module's derivation and its validator must never disagree about which
 * classes have one.
 */
export function isHospitalizedClass(encounterClass: EncounterClass): boolean {
  return HOSPITALIZED_CLASSES.includes(encounterClass);
}

/**
 * `EncounterRead` → the seven fields this question actually edits. Exactly
 * `EncounterQuestion.tsx`'s `transformEncounterForUpdate` (`:161-173`),
 * lifted out of the component so it can be tested and so the editor has no
 * reason to keep a second copy. The exact key set is pinned by a test, not
 * merely by this comment: everything else `EncounterRead` carries (the
 * patient, the facility, tags, care team, location history, permissions,
 * the two histories) is display data that must never ride along into a PUT
 * body.
 */
export function toEncounterRow(read: EncounterRead): EncounterRow {
  return {
    status: read.status,
    encounter_class: read.encounter_class,
    period: read.period,
    hospitalization: read.hospitalization,
    priority: read.priority,
    external_identifier: read.external_identifier,
    discharge_summary_advice: read.discharge_summary_advice,
  };
}

/**
 * Exactly one baseline row, keyed by the ENCOUNTER id.
 *
 * WHY NOT `SINGLETON_ROW_ID`. `core/rowIds.ts` reserves that constant for
 * single-row types that have "no server row to key off" — `appointment` and
 * `time_of_death`, both create-only. `encounter` is the opposite case: it
 * EDITS a row the server already has, and that row's identity is the
 * encounter id in the URL. Keying the baseline by it is what lets
 * {@link toRequests} decide, from the edit log alone, whether an edit is
 * about THIS encounter — see its own doc comment.
 *
 * BASELINE HONESTY (BASELINE COMPLETENESS CONTRACT). This function is only
 * ever called with a RESOLVED `EncounterRead`, and therefore always returns
 * the COMPLETE server-row set for this question — one row. While the
 * encounter query is loading or errored there is no read to convert, and
 * the caller must pass `undefined` to the hook, NEVER `[]`: an empty array
 * is a positive claim that the server has no rows, which selects
 * data-creating ops (`changes.ts`'s add-vs-baseline reclassification) and
 * makes `projectRows` drop every restored edit as an orphan. Task 8
 * discharges this by not mounting the hook at all until the query resolves,
 * so `undefined` is never actually observed downstream.
 */
export function toBaselineRows(
  read: EncounterRead,
  encounterId: string,
): BaselineRow<EncounterRow>[] {
  return [{ rowId: encounterId, row: toEncounterRow(read) }];
}

/**
 * SINGLETON COLLAPSE — deliberately `rows[0]`, not `[...rows]`.
 *
 * `rows` is `useStructuredRows`'s already-projected baseline+edits set, and
 * `SingleRowController.row` hands the editor exactly `rows[0]`. Projecting
 * every entry would mean a corrupted log (two rowIds) writes TWO encounters
 * into `values[0].value` while the editor shows one and {@link toRequests}
 * PUTs one — the content-level disagreement "PROJECTION AND SUBMIT MUST
 * AGREE" forbids, and the same collapse `appointment`'s `projectValues`
 * makes for the same reason.
 *
 * NO `isEmptyRow`, on purpose (Lesson 2 asks for ONE emptiness predicate;
 * here the honest answer is that there is no emptiness to predicate on). An
 * encounter row always has a status, a class, a period and a priority —
 * there is no blank state a clinician can clear it to, no "add" to
 * annihilate, and the section is answered from the moment the server row
 * loads. What makes an untouched section silent is not emptiness but an
 * EMPTY EDIT LOG, which {@link toRequests} checks first.
 */
export const projectValues: ProjectValues<EncounterRow> = (rows) => {
  const row = rows[0];
  if (!row) return [];
  return [{ type: "encounter", value: [row] }];
};

/**
 * The encounter's domain derivations, as ONE pure function applied to every
 * patch before it is recorded.
 *
 * It replaces three things at once:
 *  - `EncounterQuestion.tsx:134-158`, a `useEffect` keyed on
 *    `encounter.status` that called the store writer — an effect writing
 *    the very field it watched;
 *  - `:176-184`, a second effect folding the fetched encounter (and
 *    `?toDischarge`) into the same writer;
 *  - `:197-220`, mutation-time hospitalization rules that read the PREVIOUS
 *    `encounter.encounter_class` (`:205`) rather than the one the patch is
 *    setting.
 *
 * Being pure it cannot loop, it is unit-testable without a DOM, and a
 * combined class+status edit is finally evaluated against the values it is
 * SETTING rather than the ones it is replacing. Totality and the one-pass
 * fixpoint are executed for all 9 statuses × 6 classes × 3 hospitalization
 * shapes × 2 period shapes in `model.test.ts`, not asserted here.
 *
 * RETURN CONTRACT (`StructuredRowsOptions.normalizePatch`, and
 * `rowMutations.ts`'s `mergePatch`): the returned object REPLACES `patch`
 * before being spread onto the row, so it must start from `{ ...patch }` —
 * returning only the derived fields would silently drop the clinician's own
 * edit.
 *
 * TAKES ITS CONFIG rather than importing `@careConfig`: `care.config.ts`
 * reads `import.meta.env`, which does not exist under `node --test`. `now`
 * is injectable for the same reason a clock always is — so the period
 * assertions can name a value.
 *
 * THE THREE RULES, in the order they are applied:
 *
 *  1. period.end follows the status. A terminal status with no end gets
 *     `now()`; a terminal status that already has one keeps it (a discharge
 *     date the clinician picked is not re-stamped); a non-terminal status
 *     clears it. A non-terminal status with no end writes nothing at all —
 *     which is what keeps an unrelated edit on a live encounter from
 *     manufacturing a period diff.
 *  2. An ambulatory class has no hospitalization record, so one is cleared
 *     to `{}` — but only if there is something to clear. Writing `{}` over
 *     a server `null` (or an already-`{}`) would put a field the clinician
 *     never touched into the PUT body of an unrelated edit; the legacy code
 *     assigned unconditionally (`:200-202`) because it rebuilt the whole
 *     response value on every keystroke anyway and had no diff to spoil.
 *  3. A hospitalized class that is DISCHARGED gets a discharge disposition
 *     — the one already set, or the configured default.
 *
 * There is no fourth rule. The legacy `else if ("hospitalization" in …)`
 * (`:214-220`) re-pinned `discharge_disposition` to the SERVER's value on
 * every unrelated edit, so a clinician's pick vanished as soon as they
 * typed in another field. Dropped deliberately (D5), pinned by a regression
 * test.
 */
export function makeNormalizePatch({
  dischargeDisposition,
  now = () => new Date().toISOString(),
}: {
  dischargeDisposition: EncounterDischargeDisposition;
  now?: () => string;
}) {
  return function normalizePatch(
    row: EncounterRow,
    patch: Partial<EncounterRow>,
  ): Partial<EncounterRow> {
    const next = { ...row, ...patch };
    const out: Partial<EncounterRow> = { ...patch };

    // Rule 1 — period.end follows the status.
    if (TERMINAL_STATUSES.has(next.status)) {
      if (!next.period.end) out.period = { ...next.period, end: now() };
    } else if (next.period.end) {
      // `end: undefined` rather than a delete: `deepEqualJson` treats an
      // undefined-valued key as ABSENT, so this still collapses back to a
      // baseline that never had an end.
      out.period = { ...next.period, end: undefined };
    }

    // Rules 2 and 3 — the hospitalization record follows class + status.
    if (AMBULATORY_CLASSES.includes(next.encounter_class)) {
      if (
        next.hospitalization &&
        Object.keys(next.hospitalization).length > 0
      ) {
        out.hospitalization = {};
      }
    } else if (
      isHospitalizedClass(next.encounter_class) &&
      next.status === EncounterStatus.DISCHARGED
    ) {
      out.hospitalization = {
        ...next.hospitalization,
        discharge_disposition:
          next.hospitalization?.discharge_disposition ?? dischargeDisposition,
      };
    }

    return out;
  };
}

/**
 * Is a discharge disposition mandatory right now? Exactly the legacy rule
 * (`validateEncounterQuestion`, `EncounterQuestion.tsx:80-86`): a
 * DISCHARGED encounter of a hospitalized class with no disposition set. The
 * definition (Task 8) turns this into a `QuestionValidationError` on the
 * dotted field key `hospitalization.discharge_disposition`; the message
 * lives there, at the i18n boundary, because this module must not import
 * i18next.
 *
 * WHEN IT CAN ACTUALLY FIRE — read this before wiring it. {@link
 * makeNormalizePatch}'s rule 3 fills the default the instant a row becomes
 * hospitalized+discharged, so no row this session's editor produces can
 * ever fail this predicate (executed in `model.test.ts`). The only rows
 * that can are ones NOBODY EDITED: an untouched server encounter that is
 * already discharged with no disposition, or a draft restored from before
 * this port. Validation is therefore a statement about the SERVER's data,
 * not about the clinician's input — which is honest, but means the
 * definition has to decide whether an untouched section may block Save.
 * That decision belongs to `validate(projection, edits, questionId,
 * required)`, which sees `edits` and this module does not; it is named in
 * this task's report as a seam Task 8 inherits.
 */
export function requiresDischargeDisposition(
  row: EncounterRow | undefined,
): boolean {
  return (
    row?.status === EncounterStatus.DISCHARGED &&
    isHospitalizedClass(row.encounter_class) &&
    !row.hospitalization?.discharge_disposition
  );
}

/**
 * The edit log → at most one `PUT /api/v1/encounter/{encounterId}/`.
 *
 * P1-14, AT ITS SHARPEST — the first guard. TODAY
 * `definitions/encounter.tsx:49-62` maps over the PROJECTION
 * unconditionally, so submitting ANY form carrying an encounter question
 * PUT the whole encounter back — including a section the clinician never
 * opened, over whatever another user changed meanwhile. An empty log now
 * means an empty batch, full stop.
 *
 * IDENTITY, NOT POSITION — and why this differs from `appointment`.
 * `appointment`'s `resolveSingletonRow` deliberately refuses to filter by
 * rowId, because its projection can only ever fall back to `rows[0]` and an
 * identity filter would make the two sides pick different rows. Encounter
 * is the opposite case, for one concrete reason: its rowId IS the URL this
 * request is addressed to. Filtering to `rowId === encounterId` therefore
 * AGREES with `projectRows` more tightly than position would, because
 * `projectRows` emits baseline rows first, in baseline order
 * (`projectRows.ts`' step 1), and the baseline holds exactly this rowId —
 * so `rows[0]` IS this rowId's content whenever there is any, and is the
 * untouched server row when there is not. Both sides resolve the same rowId
 * through the same last-write-wins rule, so they agree even under a
 * duplicate-entry log, which `appointment` documents as a KNOWN GAP.
 *
 * The shape that makes the difference concrete: a log carrying ONLY a
 * corrupted foreign rowId. Positional resolution (`updates[0] ??
 * creates[0]` over the unfiltered log) would send that foreign row's
 * content to THIS encounter's URL while the projection showed the untouched
 * server row — a write the clinician could not see or cancel. Filtered, it
 * sends nothing, which is exactly what the projection shows. Every shape,
 * including the doubly-corrupted ones, is executed against BOTH modules in
 * `model.test.ts`'s "PROJECTION AND SUBMIT MUST AGREE" block.
 *
 * THE ONE PRECONDITION, stated rather than overclaimed: the agreement holds
 * while the baseline is keyed by the SAME id this context carries. Task 8
 * builds both from `props.encounterId`, so divergence is structurally
 * prevented rather than defended against here; the excluded shape is pinned
 * by the "KNOWN GAP" test.
 *
 * `resolveChanges(own, {})` passes NO baseline — honestly. Unlike
 * `appointment`/`charge_item`, whose baselines are permanently empty (a
 * fact about the type, stated as an empty `Map`), the encounter's baseline
 * genuinely EXISTS and is simply not available here: `composeBatch` is a
 * pure function with no access to the TanStack cache. `undefined` is the
 * contract's word for "not known", which is the true statement.
 *
 * `updates[0] ?? creates[0]`, and why `removes` is dropped (Lesson 4). After
 * the identity filter, `resolveChanges` dedups to AT MOST ONE entry across
 * all three sets, so this is an exact pick, not a preference. An `add` for
 * this rowId is reachable from a draft recorded before the baseline query
 * resolved (`editLog.ts`'s `coalesceOntoAdd` never re-labels); it compiles
 * to the same PUT, which is safe precisely because the endpoint is
 * URL-keyed and cannot create a duplicate — the case
 * `ResolvedChanges.updates`' own doc comment names. `removes` is dropped
 * because an encounter has no delete verb in this question at all: the
 * editor never removes, and `projectRows` hides a `remove`d baseline row,
 * so an empty projection and an empty batch agree.
 *
 * The body stays the SEVEN-FIELD ALLOWLIST `definitions/encounter.tsx:52-60`
 * sends today — deliberately not widened to the whole row.
 */
export async function toRequests(
  edits: readonly StructuredEdit<EncounterRow>[],
  { encounterId, facilityId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (edits.length === 0) return [];
  if (!encounterId) return [];
  if (!facilityId) {
    // A mount precondition, not a URL ingredient — `requires:
    // ["encounterId", "facilityId"]` means the question should never have
    // rendered without one. Kept as the legacy throw (`:45-47`) rather than
    // a silent `[]` so the failure is loud; `composeBatch` contains it as a
    // question-scoped `StructuredBuildError`. It is checked AFTER the
    // empty-log guard on purpose: an untouched section must stay silent
    // rather than fail the whole submit.
    throw new Error("Cannot update an encounter without a facility");
  }

  const own = edits.filter((edit) => edit.rowId === encounterId);
  if (own.length === 0) return [];

  const { creates, updates } = resolveChanges(own, {});
  const row = updates[0] ?? creates[0];
  if (!row) return [];

  return [
    {
      url: `/api/v1/encounter/${encounterId}/`,
      method: "PUT",
      body: {
        status: row.status,
        encounter_class: row.encounter_class,
        period: row.period,
        hospitalization: row.hospitalization,
        priority: row.priority,
        external_identifier: row.external_identifier,
        discharge_summary_advice: row.discharge_summary_advice,
      },
      reference_id: structuredReferenceId("encounter", questionId),
    },
  ];
}
