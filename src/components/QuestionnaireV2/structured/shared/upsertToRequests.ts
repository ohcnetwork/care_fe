import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { SoftDeleteDescriptor } from "@/components/QuestionnaireV2/structured/core/types";
import { sanitizeNote } from "@/components/QuestionnaireV2/structured/shared/sanitizeNote";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import type {
  StructuredEdit,
  StructuredQuestionType,
} from "@/types/questionnaire/structured";

/** Patient-scoped upsert endpoints all take a free-text `note` this factory
 *  normalizes; the rest of the row shape is the type's own business. */
interface NotedRow {
  note?: string;
}

/** The context an upsert request is actually composed from, after the
 *  factory's own guard has proven both ids present. */
export interface ResolvedUpsertContext {
  patientId: string;
  encounterId: string;
}

export interface UpsertToRequestsConfig<TRow extends NotedRow> {
  /** Names the `reference_id` (`structured:{type}:{questionId}`) server
   *  errors map back through. */
  type: StructuredQuestionType;
  /** Path segment(s) between `/api/v1/patient/{patientId}/` and `/upsert/`
   *  — e.g. `"symptom"`, `"medication/statement"`. */
  resource: string;
  /** How this type marks a baseline row's removal; see
   *  `SoftDeleteDescriptor` (`core/types`). */
  softDelete: SoftDeleteDescriptor<TRow>;
  /** Wire-only fields stamped onto every datapoint, applied AFTER `note`
   *  and `encounter` so they win — `medication/statement`'s endpoint also
   *  wants the patient in the body. */
  decorateRow?: (row: TRow, context: ResolvedUpsertContext) => object;
}

/**
 * The shared differ behind every patient-scoped `.../upsert/` type
 * (`allergy_intolerance`, `symptom`, `diagnosis`, `medication_statement`):
 * an edit log → at most ONE POST carrying only the rows this session
 * touched. An empty edit log yields an empty batch, so untouched baseline
 * rows are never re-sent and a concurrent edit to an unrelated record cannot
 * be overwritten.
 *
 * `resolveChanges` receives no baseline: the differ only sees the edit log,
 * and the hook's prune effect drops edits for rows the baseline has proven
 * gone before submit reaches here. A `removes` entry always carries `.row`
 * when a softDelete descriptor is supplied; the `flatMap` guard honors the
 * shared optional type instead of asserting.
 *
 * `encounter: encounterId` overrides each row's own value on purpose: a row
 * can carry a different encounter — a patient-scoped baseline fetch returns
 * rows from other encounters, and a row reused from the historical selector
 * keeps the encounter it was originally recorded under.
 *
 * Kept React- and `@careConfig`-free (like the `model.ts` modules that call
 * it) so the node:test harness can import it.
 */
export function makeUpsertToRequests<TRow extends NotedRow>({
  type,
  resource,
  softDelete,
  decorateRow,
}: UpsertToRequestsConfig<TRow>) {
  return async function toRequests(
    edits: readonly StructuredEdit<TRow>[],
    { patientId, encounterId, questionId }: StructuredRequestContext,
  ): Promise<StructuredBatchEntry[]> {
    if (!patientId || !encounterId) return [];
    const { creates, updates, removes } = resolveChanges(edits, { softDelete });
    const rows = [
      ...creates,
      ...updates,
      ...removes.flatMap((entry) => (entry.row ? [entry.row] : [])),
    ];
    if (rows.length === 0) return [];
    return [
      {
        url: `/api/v1/patient/${patientId}/${resource}/upsert/`,
        method: "POST",
        body: {
          datapoints: rows.map((row) => ({
            ...row,
            note: sanitizeNote(row.note),
            encounter: encounterId,
            ...decorateRow?.(row, { patientId, encounterId }),
          })),
        },
        reference_id: structuredReferenceId(type, questionId),
      },
    ];
  };
}
