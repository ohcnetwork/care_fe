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
 * `EncounterEdit` carries no `id` of its own — the only endpoint that
 * consumes it is URL-keyed (`PUT /api/v1/encounter/{id}/`). That fact
 * drives {@link toBaselineRows}'s rowId, {@link toRequests}' identity
 * filter, and why an `add` and an `update` compile to the same request.
 */
export type EncounterRow = EncounterEdit;

/** Statuses that END an encounter, and therefore want a `period.end`. */
const TERMINAL_STATUSES: ReadonlySet<EncounterStatus> = new Set([
  EncounterStatus.DISCHARGED,
  EncounterStatus.COMPLETED,
  EncounterStatus.CANCELLED,
  EncounterStatus.DISCONTINUED,
  EncounterStatus.ENTERED_IN_ERROR,
]);

/** Classes with no hospitalization record at all. */
const AMBULATORY_CLASSES: readonly EncounterClass[] = ["amb", "vr", "hh"];

/** Classes that DO carry one, and therefore need a discharge disposition
 *  once discharged. */
const HOSPITALIZED_CLASSES: readonly EncounterClass[] = [
  "imp",
  "obsenc",
  "emer",
];

/**
 * Does this class carry a hospitalization record? The single authority for
 * this split — the editor's hospitalization panel, the derivation rules
 * and the validator must never disagree about which classes have one.
 */
export function isHospitalizedClass(encounterClass: EncounterClass): boolean {
  return HOSPITALIZED_CLASSES.includes(encounterClass);
}

/**
 * `EncounterRead` → the seven fields this question edits. Everything else
 * `EncounterRead` carries (patient, facility, tags, care team, histories,
 * permissions) is display data that must never ride along into a PUT
 * body; the exact key set is pinned by a test.
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
 * Exactly one baseline row, keyed by the ENCOUNTER id — not
 * `SINGLETON_ROW_ID`, which `core/rowIds.ts` reserves for create-only
 * types with no server row. This row's identity is the encounter id in the
 * PUT URL; keying the baseline by it lets {@link toRequests} decide from
 * the edit log alone whether an edit is about THIS encounter.
 *
 * Only ever called with a resolved `EncounterRead`, so the returned set is
 * complete. While the query is loading or errored the caller must pass
 * `undefined` to the hook, never `[]` — an empty array claims the server
 * has no rows, which reclassifies edits as data-creating and makes
 * `projectRows` drop every restored edit as an orphan.
 */
export function toBaselineRows(
  read: EncounterRead,
  encounterId: string,
): BaselineRow<EncounterRow>[] {
  return [{ rowId: encounterId, row: toEncounterRow(read) }];
}

/**
 * Deliberately `rows[0]`, not `[...rows]`: `SingleRowController.row` hands
 * the editor exactly `rows[0]`, so a corrupted two-rowId log must not
 * project TWO encounters into `values[0].value` while the editor shows one
 * and {@link toRequests} PUTs one.
 *
 * No `isEmptyRow`: an encounter row always has a status, class, period and
 * priority — there is no blank state to clear it to. An untouched section
 * is silent because its EDIT LOG is empty, which {@link toRequests} checks
 * first.
 */
export const projectValues: ProjectValues<EncounterRow> = (rows) => {
  const row = rows[0];
  if (!row) return [];
  return [{ type: "encounter", value: [row] }];
};

/**
 * The encounter's domain derivations, one pure function applied to every
 * patch before it is recorded; a combined class+status edit is evaluated
 * against the values it is setting.
 *
 * Returns its DERIVED FIELDS ONLY (`StructuredRowsOptions.normalizePatch`);
 * `mergePatch` lands them on top of the clinician's own patch. Takes its
 * config rather than importing `@careConfig`
 * (`care.config.ts` reads `import.meta.env`, absent under `node --test`);
 * `now` is injectable so period assertions can name a value.
 *
 * Rules, in order:
 *  1. period.end follows the status — a terminal status with no end gets
 *     `now()`; an existing end is kept (a clinician-picked date is not
 *     re-stamped); a non-terminal status clears it, writing nothing when
 *     there is nothing to clear, so an unrelated edit cannot manufacture a
 *     period diff.
 *  2. An ambulatory class clears a POPULATED hospitalization to `{}` —
 *     never writes `{}` over a server `null`/already-`{}`, which would put
 *     an untouched field into the PUT body.
 *  3. A hospitalized class that is DISCHARGED gets a disposition — the one
 *     set, or the configured default.
 *
 * Deliberately NO rule re-pins `discharge_disposition` to the server value
 * on unrelated edits (that erased the clinician's pick mid-form); pinned
 * by a regression test.
 */
export function makeNormalizePatch({
  dischargeDisposition,
  now = () => new Date().toISOString(),
}: {
  // `| undefined`, matching `careConfig.defaultDischargeDisposition` (the
  // env var behind it is optional). Rule 3's `??` then leaves the
  // disposition unset — onto the itself-optional field — exactly the
  // behavior when no default is configured.
  dischargeDisposition: EncounterDischargeDisposition | undefined;
  now?: () => string;
}) {
  return function normalizePatch(
    row: EncounterRow,
    patch: Partial<EncounterRow>,
  ): Partial<EncounterRow> {
    // The row as the clinician's patch leaves it — every rule below reads
    // the values being SET, not the pre-edit ones, so a combined
    // class+status edit is judged as a whole.
    const next = { ...row, ...patch };
    const out: Partial<EncounterRow> = {};

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
 * Is a discharge disposition mandatory: a DISCHARGED encounter of a
 * hospitalized class with no disposition set. The definition turns this
 * into a `QuestionValidationError` on
 * `hospitalization.discharge_disposition`; the message lives there, at the
 * i18n boundary — this module must not import i18next.
 *
 * Where `careConfig.defaultDischargeDisposition` is unconfigured,
 * {@link makeNormalizePatch}'s rule 3 leaves the field unset, so rows this
 * editor produces ("Mark for discharge", the `?toDischarge` seed) DO fail
 * this predicate — live required-field enforcement, Save blocks until a
 * value is picked. Only with a configured default does it degrade to a
 * safety net for rows nobody edited this session.
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
 * Whether the missing-disposition error may block Save. An untouched
 * section may NOT: `edits.length > 0` is an unconditional precondition,
 * regardless of the question's own `required` flag — unlike
 * `appointment`'s `needsSlot`, which hard-blocks a required question even
 * untouched. Blocking Save over server data the clinician never brought
 * into the session would couple validation to untouched server data.
 * `toRequests`' first guard already guarantees an untouched section produces
 * zero requests, and this extends the same guarantee to validation.
 */
export function blocksSaveForMissingDischargeDisposition(
  row: EncounterRow | undefined,
  edits: readonly StructuredEdit<EncounterRow>[],
): boolean {
  return edits.length > 0 && requiresDischargeDisposition(row);
}

/**
 * The edit log → at most one `PUT /api/v1/encounter/{encounterId}/`. An
 * empty log means an empty batch — an untouched section must never PUT the
 * encounter back over whatever another user changed meanwhile.
 *
 * IDENTITY, NOT POSITION — unlike `appointment`'s `resolveSingletonRow`,
 * which cannot filter by rowId: the encounter's rowId IS the URL this
 * request is addressed to, and the baseline holds exactly this rowId, so
 * filtering to `rowId === encounterId` agrees with `projectRows` even
 * under a duplicate-entry log. A log carrying only a corrupted foreign rowId
 * sends nothing, matching the untouched row the projection shows.
 *
 * After the identity filter the sanitized log holds at most one entry
 * for `encounterId`, so `updates[0] ?? creates[0]` is an exact pick; an
 * `add` recorded while the baseline is unresolved compiles to the same
 * PUT, safe because the endpoint is URL-keyed. `removes` is dropped:
 * this question has no delete verb, and
 * `projectRows` hides a `remove`d baseline row, so an empty projection and
 * zero requests agree.
 *
 * The body stays the seven-field allowlist — deliberately not widened to
 * the whole row.
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
    // rendered without one. A throw rather than a silent `[]` so the
    // failure is loud; `composeBatch` contains it as a question-scoped
    // `StructuredBuildError`. It is checked AFTER the empty-log guard on
    // purpose: an untouched section must stay silent rather than fail the
    // whole submit.
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
