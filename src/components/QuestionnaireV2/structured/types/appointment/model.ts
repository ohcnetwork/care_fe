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

/** Module scope — `useStructuredRows` memoizes on this identity, and an
 *  inline arrow would rewrite the projection on every render (annex
 *  `p1-state-core.md` §18, "Risk — projection write loop"). */
export const projectValues: ProjectValues<AppointmentRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "appointment", value: [...rows] }];

/** `mode: "single"` with no baseline needs a complete row to record an
 *  `add` against — `patch` is always the whole row. Appointment is
 *  create-only: there is no server row to seed from, unlike `encounter`. */
export function createSeed(): AppointmentRow {
  return { note: "", slot_id: "", tags: [] };
}

/** Reproduces `AppointmentQuestion.tsx:144-153`: clearing every field
 *  annihilates the `add`, so the section goes clean rather than sitting on
 *  an empty row that keeps the form dirty forever. */
export function isEmptyRow(row: AppointmentRow): boolean {
  return !row.note?.trim() && !row.slot_id && !row.tags?.length;
}

export async function toRequests(
  edits: readonly StructuredEdit<AppointmentRow>[],
  { patientId, facilityId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId || !facilityId) return [];
  const { creates } = resolveChanges(edits, {});
  const row = creates[0];
  // P1-16. Appointment is create-only: there is no server row to update,
  // so a slot is the whole address of the request. Without one, today's
  // definition composes `/slots/undefined/create_appointment/`
  // (`definitions/appointment.tsx:47`); the 400 that comes back rolls the
  // entire atomic batch, so a half-filled appointment silently discards
  // every other section the clinician just saved. No slot => no request.
  // `needsSlot` below is what tells the clinician why nothing was booked.
  if (!row?.slot_id) return [];
  return [
    {
      url: `/api/v1/facility/${facilityId}/slots/${row.slot_id}/create_appointment/`,
      method: "POST",
      body: { note: row.note, patient: patientId, tags: row.tags },
      reference_id: structuredReferenceId("appointment", questionId),
    },
  ];
}

/**
 * Is a slot mandatory right now? The other half of P1-16: silently
 * dropping a slotless appointment (above) is only safe if the clinician is
 * told. Two triggers:
 *  - the question is REQUIRED — an appointment is the answer, so it needs
 *    a slot regardless of what else is filled in;
 *  - the section was TOUCHED and carries content other than a slot — a
 *    reason or tags with nowhere to book them. Today this passes
 *    validation and quietly books nothing.
 * Untouched and not required stays silent: an appointment section nobody
 * opened is not an error. The message itself is added in Task 4's
 * definition, at the i18n boundary — this module must not import i18next.
 */
export function needsSlot(
  projection: readonly AppointmentRow[],
  edits: readonly StructuredEdit<AppointmentRow>[],
  required: boolean,
): boolean {
  const row = projection[0];
  if (row?.slot_id) return false;
  if (required) return true;
  const partiallyFilled = !!row?.note?.trim() || !!row?.tags?.length;
  return edits.length > 0 && partiallyFilled;
}
