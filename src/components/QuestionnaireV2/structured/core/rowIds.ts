import type { RowId } from "./types";

/**
 * A row created in this session. Opaque: nothing parses a rowId; the `op`
 * and the baseline map are what tell add from update.
 *
 * Uses the global `crypto.randomUUID()` — the same access pattern already
 * used elsewhere in this codebase without an import
 * (`src/components/QuestionnaireV2/shared/questionTree.ts:128,169`,
 * `src/components/QuestionnaireV2/builder/builderReducer.ts:39-40`).
 * Available both in the browser (Vite's target) and under Node 19+ (this
 * repo's `test:unit` runs on Node 23), so it is safe for a module that is
 * imported from both a component and a `node:test` spec.
 */
export function newRowId(): RowId {
  return crypto.randomUUID();
}

/**
 * The fixed rowId every single-row type uses when it has no server row to
 * key off (`appointment`, `time_of_death`). A constant, not a uuid, so a
 * drafted edit still lands on the singleton after a reload — the whole
 * point of rowId stability.
 */
export const SINGLETON_ROW_ID: RowId = "singleton";
