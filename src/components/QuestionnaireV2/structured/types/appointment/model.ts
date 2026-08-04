import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

/** The wire shape is already the row shape — no widening needed, so the
 *  `appointment` arm of `StructuredDataMap` (`structured/types.ts:42`) is
 *  untouched by this port. */
export type AppointmentRow = CreateAppointmentQuestion;

/**
 * Is `row.slot_id` a real slot address, not just a truthy string? Review
 * finding: a bare `!row?.slot_id` guard treats the LITERAL STRING
 * `"undefined"` as a valid slot — reachable if a caller stringifies a
 * missing id (`String(slot?.id)`) rather than leaving it `undefined` —
 * which composes exactly the P1-16 URL (`/slots/undefined/
 * create_appointment/`) this whole module exists to prevent. Whitespace
 * (`"  "`) is the same failure one step removed: truthy, trims to nothing.
 * `"null"` is included by the identical reasoning (`String(null)`), though
 * only `"undefined"` was the reproduced case.
 *
 * THE ONE PREDICATE for "is a slot picked" — shared by `toRequests`
 * (SUBMISSION) and `needsSlot` (VALIDATION) below, so the two can never
 * disagree about what counts as a slot between "should this submit" and
 * "should the clinician be told it's missing". Also folded into
 * `isEmptyRow` (below): a row whose only content is a garbage `slot_id`
 * string is not really answered either.
 */
function hasValidSlot(row: AppointmentRow | undefined): boolean {
  const slotId = row?.slot_id?.trim();
  return !!slotId && slotId !== "undefined" && slotId !== "null";
}

/** Reproduces `AppointmentQuestion.tsx:144-153`: clearing every field
 *  annihilates the `add`, so the section goes clean rather than sitting on
 *  an empty row that keeps the form dirty forever.
 *
 *  Declared before `projectValues` (which calls it) rather than after, so
 *  the read order matches the call order — the two are read together in
 *  review anyway, per the projection/submission split below. */
export function isEmptyRow(row: AppointmentRow): boolean {
  return !row.note?.trim() && !hasValidSlot(row) && !row.tags?.length;
}

/**
 * PROJECTION vs VALIDATION vs SUBMISSION — three different questions, three
 * different predicates, reconciled deliberately rather than collapsed into
 * one (review finding on Task 2's `time_of_death`, which shipped one split
 * and is fixing it: `projectValues` projected every row while `toRequests`
 * filtered blanks in the differ, so a genuinely blank row read as ANSWERED
 * — `entryHasContent`, `form/engine/store.ts:372-376`, treats any non-empty
 * `value` array as content, regardless of what is actually inside it — while
 * submitting nothing. Silent drop, exactly what contract v2 exists to
 * eliminate).
 *
 * The naive port of that fix here would be "make `isEmptyRow` the one
 * authority for everything" — but appointment cannot use a single
 * predicate for all three questions, because unlike `time_of_death` (one
 * field; "blank" and "unsubmittable" are the same fact), appointment's
 * three questions have three different honest answers for the exact same
 * row — a note typed with no slot picked:
 *
 *  - PROJECTION ("does the clinician see this and does the outline tick
 *    light?") — driven by `isEmptyRow`. A wholly blank row (reachable only
 *    via a restored/hand-edited draft; the live reducer's `isEmptyRow`
 *    wiring in `editLog.ts` annihilates it in-session) must NOT project —
 *    that is Task 2's fix, applied here too. But a note-only row is real
 *    clinician input, not corruption; it MUST project so they can see what
 *    they typed. `isEmptyRow` already draws exactly this line (false for
 *    any non-blank field), so it is the right authority for THIS question.
 *  - VALIDATION ("does the clinician get told something is missing?") —
 *    driven by `needsSlot`, below. A note-only row is content without a
 *    destination; the clinician must be told, not left to discover a quiet
 *    no-op after submit.
 *  - SUBMISSION ("does a request go out?") — driven by `hasValidSlot` in
 *    `toRequests`, NOT by `isEmptyRow`. A slot is the address the POST is
 *    sent to (`/slots/{slot_id}/create_appointment/`); no address, no
 *    request, full stop — regardless of how much other content the row
 *    carries. This is intentionally a STRICTER gate than `isEmptyRow` for
 *    this one type: every row `isEmptyRow` calls non-blank still needs its
 *    own slot check before it can submit.
 *
 * The three never disagree in the direction that matters (silently
 * dropping content the clinician never got a chance to fix): a row that
 * won't submit either isn't projected at all (wholly blank) or projects
 * AND trips `needsSlot` (partially filled) — never projects clean while
 * quietly submitting nothing. Pinned by dedicated tests for each of the
 * three below, not just inferred from one shared implementation.
 */
export const projectValues: ProjectValues<AppointmentRow> = (rows) => {
  // Singleton collapse: `rows` is `useStructuredRows`'s already-projected
  // baseline+edits set. `rows[0]` is exactly what `SingleRowController.row`
  // itself shows the editor (`useStructuredRows.ts:616`) — this must agree
  // with THAT, not spread every entry, even under a corrupted multi-rowId
  // log (see `resolveSingletonRow`'s doc comment for why `toRequests`
  // resolves the SAME position, not a rowId it filters for independently).
  const row = rows[0];
  if (!row || isEmptyRow(row)) return [];
  return [{ type: "appointment", value: [row] }];
};

/** `mode: "single"` with no baseline needs a complete row to record an
 *  `add` against — `patch` is always the whole row. Appointment is
 *  create-only: there is no server row to seed from, unlike `encounter`. */
export function createSeed(): AppointmentRow {
  return { note: "", slot_id: "", tags: [] };
}

/**
 * Resolves the edit log down to the one row this create-only singleton
 * currently holds — or `undefined` if nothing survives.
 *
 * PASSES AN EXPLICIT, KNOWN-EMPTY `baseline` TO `resolveChanges` — NOT
 * `{}` (which defaults `baseline` to `undefined`, "not yet known").
 * Appointment's baseline is not merely unknown at submit time, it is
 * ALWAYS EMPTY: a create-only singleton has no server row, ever, to
 * update or remove. That is a fact about the TYPE, not about this one
 * call, so it can be stated here directly rather than waiting on a
 * baseline `toRequests(edits, ctx)` structurally never receives (every
 * real v2 differ calls `resolveChanges(edits, {})` with no baseline, by
 * design — `projectRows.ts`'s `pruneOrphanEdits` doc comment: "nothing [at
 * compose time] is solved... because nothing there ever HOLDS a baseline
 * to solve it with"). Supplying the constant empty Map here makes this
 * function's orphan handling agree with what `projectRows`/
 * `findOrphanRowIds` conclude given the SAME fact (Task 4 wires
 * `baseline: []` for this type — `useStructuredRows.ts`'s own doc comment
 * on `StructuredRowsOptions.baseline` names `appointment` explicitly as a
 * type that "never has a baseline at all") — an `update`/`remove` for ANY
 * rowId is an orphan here, every time, dropped rather than resurrected.
 * `updates`/`removes` can therefore never hold anything this call
 * produces; only `creates` can.
 *
 * REVIEW FIX — do NOT pre-filter `edits` to a fixed singleton rowId before
 * calling `resolveChanges`. An earlier draft of this function did exactly
 * that (matching `SINGLETON_ROW_ID` explicitly), reasoning that
 * `resolveChanges`'s output strips `rowId` entirely so a corrupted draft's
 * second, bogus rowId could otherwise land in `creates` indistinguishable
 * from the real one. True, but it created a WORSE problem: `projectValues`
 * (above) has the identical blind spot — its signature is bare
 * `TRow[]`, no rowId either — and can only ever fall back to positional
 * `rows[0]`, never an identity filter. Filtering `toRequests` by identity
 * while `projectValues` falls back to position means the two pick
 * DIFFERENT rows under a corrupted multi-rowId log — reviewed and
 * confirmed executable: projection shows one row's content, submission
 * sends a different row's, the exact content-level disagreement
 * "PROJECTION AND SUBMIT MUST AGREE" forbids.
 *
 * The fix is to use the SAME signal both sides actually have: log order.
 * `resolveChanges` and `projectRows` are documented (the plan's binding
 * constraint, restated in `changes.ts`'s own doc comment) to resolve a log
 * through the same last-write-wins map and the same baseline-consulting
 * orphan rule — which, given the identical `baseline` (the empty Map
 * here, `toBaselineMap([])` there), means `resolveChanges(edits,
 * {baseline}).creates` and `projectRows([], edits, {}).map(r => r.row)`
 * necessarily agree on both WHICH rowIds survive and in what ORDER they
 * appear (first occurrence in `edits`/`log`). Taking `creates[0]` here is
 * therefore exactly `rows[0]` there, by construction — not by hoping
 * position 0 happens to be the "real" singleton. A corrupted log can still
 * make both sides show/send the WRONG row's content; it can no longer make
 * them show/send TWO DIFFERENT rows'.
 */
function resolveSingletonRow(
  edits: readonly StructuredEdit<AppointmentRow>[],
): AppointmentRow | undefined {
  const { creates } = resolveChanges(edits, { baseline: new Map() });
  return creates[0];
}

export async function toRequests(
  edits: readonly StructuredEdit<AppointmentRow>[],
  { patientId, facilityId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !facilityId) return [];
  const row = resolveSingletonRow(edits);
  // P1-16 (SUBMISSION gate — see the doc comment on `projectValues` for how
  // this reconciles with projection/validation). Appointment is
  // create-only: there is no server row to update, so a slot is the whole
  // address of the request. Without a VALID one, today's definition
  // composes `/slots/undefined/create_appointment/`
  // (`definitions/appointment.tsx:47`); the 400 that comes back rolls the
  // entire atomic batch, so a half-filled appointment silently discards
  // every other section the clinician just saved. No slot => no request,
  // even though `row` itself may be real, non-empty content — `needsSlot`
  // below is what tells the clinician why nothing was booked.
  if (!row || !hasValidSlot(row)) return [];
  const slotId = row.slot_id.trim();
  return [
    {
      url: `/api/v1/facility/${facilityId}/slots/${slotId}/create_appointment/`,
      method: "POST",
      body: { note: row.note, patient: patientId, tags: row.tags },
      reference_id: structuredReferenceId("appointment", questionId),
    },
  ];
}

/**
 * Is a slot mandatory right now? The VALIDATION half of the three-way
 * reconciliation on `projectValues`' doc comment: silently dropping a
 * slotless appointment (`toRequests`, above) is only safe if the clinician
 * is told. Two triggers:
 *  - the question is REQUIRED — an appointment is the answer, so it needs
 *    a slot regardless of what else is filled in;
 *  - the section was TOUCHED (`edits.length > 0`) and carries content
 *    other than a slot — a reason or tags with nowhere to book them.
 *    Today this passes validation and quietly books nothing.
 * Untouched and not required stays silent: an appointment section nobody
 * opened is not an error. `partiallyFilled` reads `projection[0]` — the
 * SAME positional row `toRequests`/`resolveSingletonRow` resolves to for a
 * well-formed log (see that function's doc comment) — so a log whose only
 * content is an orphaned edit (nothing survives to `projection[0]`) can
 * never trip this on content nobody can see: `partiallyFilled` is `false`
 * whenever `row` itself is `undefined`, independent of `edits.length`.
 * The message itself is added in Task 4's definition, at the i18n
 * boundary — this module must not import i18next.
 */
export function needsSlot(
  projection: readonly AppointmentRow[],
  edits: readonly StructuredEdit<AppointmentRow>[],
  required: boolean,
): boolean {
  const row = projection[0];
  if (hasValidSlot(row)) return false;
  if (required) return true;
  const partiallyFilled = !!row?.note?.trim() || !!row?.tags?.length;
  return partiallyFilled && edits.length > 0;
}
