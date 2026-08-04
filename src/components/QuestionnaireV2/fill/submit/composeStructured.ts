import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";
import { sanitizeStructuredEditLog } from "@/types/questionnaire/structured";

import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";

/**
 * A structured question's EDIT LOG — user intent, the only thing that
 * compiles into requests and the only thing drafts persist. `undefined`
 * (a v1 question, a fresh v2 question, a pre-`edits` draft) reads as an
 * empty log, so "nothing changed" and "never touched" are the same thing
 * to every consumer.
 *
 * Hardened because the sources are untrusted JSON — a localStorage draft,
 * a server `response_dump` written by another build. Malformed entries are
 * dropped rather than thrown on, and duplicates collapse to the last one
 * per `rowId`: the "at most one edit per rowId" invariant every differ
 * relies on to decide POST-vs-PUT, and a hand-edited draft must not be
 * able to make one row emit two conflicting requests. That sanitization is
 * `sanitizeStructuredEditLog` (`types/questionnaire/structured.ts`) — the
 * SAME ingestion-boundary gate `structured/core/useStructuredRows.ts` runs
 * its own `response.edits` through, so a doubly-malformed log is reduced to
 * a well-formed one (at most one entry per `rowId`, in FIRST-occurrence
 * order) before EITHER the projection (`projectRows`) or the submit
 * compiler (`resolveChanges`, via `toRequests` below) ever sees it — see
 * that function's doc comment for the full "why this must happen upstream
 * of both" argument (master plan "Carry-forwards out of Phase 1" item 1).
 *
 * DIVERGENCE FROM THE DESIGN ANNEX (`docs/superpowers/specs/annexes/
 * p1-shim.md` §a.7): the annex places this function in
 * `structured/registry.ts`, as a sibling of `structuredDataAny`. It lives
 * here instead because (a) `registry.ts` transitively imports every core
 * structured definition's real component tree (CSS, UI libraries) and is
 * provably unrunnable under the plain `node --test` harness this module
 * exists to be tested under (confirmed by hand: importing `registry.ts`
 * under `node --test` throws on `react-day-picker`'s stylesheet before a
 * single assertion runs — the same constraint `contract.ts`'s file-level
 * doc comment documents for the identical reason), and (b) Task 8's
 * territory does not include `registry.ts`. Both `composeBatch.ts` and
 * `validateStructured.ts` import it from here instead of from
 * `registry.ts`.
 */
export function structuredEditsOf(
  response: QuestionnaireResponse | undefined,
): StructuredEditRecord[] {
  return sanitizeStructuredEditLog(response?.edits);
}

/**
 * What `composeStructuredV2Requests` needs from a resolved structured
 * type — a structural subset of `ResolvedStructuredType`
 * (`structured/registry.ts`) / `StructuredTypeDefinition`
 * (`structured/types.ts`), duck-typed rather than imported so this module
 * stays import-free of `registry.ts` (see `structuredEditsOf`'s doc
 * comment) and is exercisable under plain `node --test`. Every real
 * definition — core or plugin — satisfies this structurally, so
 * `composeBatch.ts` passes its resolved definition straight through with
 * no cast.
 */
export interface StructuredV2Compiler {
  toRequests: (
    edits: readonly StructuredEditRecord[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}

/**
 * The v2 leg of `composeBatch`'s structured compile step, extracted as a
 * pure function so it is unit-testable under `node --test` (`composeBatch.ts`
 * itself imports `structured/registry.ts`, which is not runnable there —
 * see `structuredEditsOf`'s doc comment).
 *
 * Only what the clinician CHANGED reaches `toRequests` — the projection
 * (the patient's existing rows, `values[0].value`) is display state and
 * never reaches a domain endpoint, so an untouched section cannot
 * re-upsert anything (P1-14, structurally, for every v2 type at once).
 * Short-circuits on an empty log WITHOUT calling `toRequests` at all, so
 * the guarantee holds even for a type whose own `toRequests` is not
 * itself empty-safe.
 */
export async function composeStructuredV2Requests(
  definition: StructuredV2Compiler,
  response: QuestionnaireResponse,
  context: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  const edits = structuredEditsOf(response);
  if (edits.length === 0) return [];
  return definition.toRequests(edits, context);
}
