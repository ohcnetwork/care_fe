import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";

export type { TimeOfDeathRow };

/** Module scope — `useStructuredRows` memoizes on this identity, and an
 *  inline arrow would rewrite the projection on every render (annex
 *  `p1-state-core.md` §18, "Risk — projection write loop"). */
export const projectValues: ProjectValues<TimeOfDeathRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "time_of_death", value: [...rows] }];

/** `mode: "single"` with no baseline needs a complete row to record an
 *  `add` against — `patch` is always the whole row. */
export function createSeed(): TimeOfDeathRow {
  return { deceased_datetime: "" };
}

/** Clearing the field annihilates the `add`, the log empties, and the
 *  section goes honestly clean — no draft, no request, no dirty prompt. */
export function isEmptyRow(row: TimeOfDeathRow): boolean {
  return !row.deceased_datetime;
}

export async function toRequests(
  edits: readonly StructuredEdit<TimeOfDeathRow>[],
  { patientId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  // `subjects` is patient/encounter, so a patient is in scope in practice;
  // narrowed rather than asserted because the context type is optional for
  // plugin types on a resource subject.
  if (!patientId) return [];
  const { creates, updates } = resolveChanges(edits, {});
  return [...creates, ...updates]
    .filter((row) => !!row.deceased_datetime)
    .map((row) => ({
      url: `/api/v1/patient/${patientId}/`,
      method: "PUT" as const,
      body: { deceased_datetime: row.deceased_datetime },
      reference_id: structuredReferenceId("time_of_death", questionId),
    }));
}
