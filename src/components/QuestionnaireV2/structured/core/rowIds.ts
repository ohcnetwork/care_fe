import type { RowId } from "./types";

/**
 * A row created in this session. Opaque: nothing parses a rowId; the `op`
 * and the baseline map are what tell add from update.
 *
 * Uses the global `crypto.randomUUID()` — available both in the browser
 * and under Node 19+, so it is safe for a module imported from both a
 * component and a `node:test` spec.
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
