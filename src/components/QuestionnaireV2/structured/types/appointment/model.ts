import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

/** The wire shape is already the row shape — no widening needed. */
export type AppointmentRow = CreateAppointmentQuestion;

/**
 * Is `row.slot_id` a real slot address, not just a truthy string? A caller
 * that stringifies a missing id (`String(slot?.id)`) hands us the literal
 * `"undefined"`/`"null"` — truthy, and composing exactly the
 * `/slots/undefined/create_appointment/` URL this module exists to
 * prevent; whitespace is the same failure one step removed.
 *
 * THE ONE PREDICATE for "is a slot picked" — shared by `toRequests`,
 * `needsSlot` and `isEmptyRow`, so submission, validation and emptiness
 * can never disagree about what counts as a slot.
 */
function hasValidSlot(row: AppointmentRow | undefined): boolean {
  const slotId = row?.slot_id?.trim();
  return !!slotId && slotId !== "undefined" && slotId !== "null";
}

/** Clearing every field annihilates the `add`, so the section goes clean
 *  rather than sitting on an empty row that keeps the form dirty forever. */
export function isEmptyRow(row: AppointmentRow): boolean {
  return !row.note?.trim() && !hasValidSlot(row) && !row.tags?.length;
}

/**
 * PROJECTION vs VALIDATION vs SUBMISSION — three questions, three
 * predicates, reconciled deliberately. For the same row (a note typed, no
 * slot picked):
 *
 *  - PROJECTION (`isEmptyRow`) — a wholly blank row must not project (a
 *    non-empty value array reads as ANSWERED to `entryHasContent`, lighting
 *    the outline tick while submitting nothing), but a note-only row is
 *    real clinician input and MUST project.
 *  - VALIDATION (`needsSlot`) — a note-only row is content without a
 *    destination; the clinician must be told, not left to discover a quiet
 *    no-op after submit.
 *  - SUBMISSION (`hasValidSlot` in `toRequests`) — the slot is the address
 *    of the POST; no address, no request, however much other content the
 *    row carries: a stricter gate than `isEmptyRow`.
 *
 * The three never disagree in the direction that matters: a row that won't
 * submit either isn't projected at all, or projects AND trips `needsSlot`
 * — never projects clean while quietly submitting nothing. Each leg is
 * pinned by its own test.
 */
export const projectValues: ProjectValues<AppointmentRow> = (rows) => {
  // Singleton collapse: `rows` is `useStructuredRows`'s already-projected
  // baseline+edits set. `rows[0]` is exactly what `SingleRowController.row`
  // itself shows the editor — this must agree
  // with THAT, not spread every entry, even under a corrupted multi-rowId
  // log (see `resolveSingletonRow`'s doc comment for why `toRequests`
  // resolves the SAME position, not a rowId it filters for independently).
  const row = rows[0];
  if (!row || isEmptyRow(row)) return [];
  return [{ type: "appointment", value: [row] }];
};

/** A single-row type (`useStructuredSingleRow`) with no baseline needs a
 *  complete row to record an `add` against — `patch` is always the whole
 *  row. Appointment is create-only: there is no server row to seed from,
 *  unlike `encounter`. */
export function createSeed(): AppointmentRow {
  return { note: "", slot_id: "", tags: [] };
}

/**
 * Resolves the edit log down to the one row this create-only singleton
 * holds, or `undefined`. Only `creates` can matter: a create-only
 * singleton has no server row, ever — an add→remove pair annihilates
 * inside the reducer, and there is no endpoint verb for an update.
 *
 * Do NOT pre-filter `edits` to a fixed singleton rowId: `projectValues`'
 * signature is bare `TRow[]` — it can only fall back to positional
 * `rows[0]` — so an identity filter here would make projection and
 * submission pick DIFFERENT rows under a corrupted multi-rowId log. Both
 * sides instead use the same signal, log order, so `creates[0]` is
 * `rows[0]` by construction for any log with one entry per rowId — which
 * every log produced by `applyEditToLog` or surviving
 * `sanitizeStructuredEditLog` is.
 */
function resolveSingletonRow(
  edits: readonly StructuredEdit<AppointmentRow>[],
): AppointmentRow | undefined {
  const { creates } = resolveChanges(edits, {});
  return creates[0];
}

export async function toRequests(
  edits: readonly StructuredEdit<AppointmentRow>[],
  { patientId, facilityId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !facilityId) return [];
  const row = resolveSingletonRow(edits);
  // SUBMISSION gate (see `projectValues`). Appointment is create-only: the
  // slot is the whole address of the request, and composing the URL
  // without a valid one fails server-side — rolling back the entire atomic
  // batch, so a half-filled appointment would silently discard every other
  // section. No slot => no request, even though `row` may be real content;
  // `needsSlot` is what tells the clinician why nothing was booked.
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
 * The message itself is added in the definition, at the i18n boundary —
 * this module must not import i18next.
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
