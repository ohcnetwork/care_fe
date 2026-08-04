import type {
  EditLog,
  ProjectedRow,
  RowEdit,
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * The domain decisions behind `useStructuredRows`'s `updateRow`/`setRow`/
 * `removeRow`/`clearRow` mutators and its one-shot `initialEdits` seed,
 * extracted per the task's non-negotiable "no branching logic in the hook"
 * rule (review finding, post-3b41fe4fd) — these were previously inline
 * conditionals in `useStructuredRows.ts` that the harness (no DOM, cannot
 * render a hook) could never reach. Every function below is pure and
 * `node:test`-covered (`rowMutations.test.ts`).
 */

// ---------------------------------------------------------------------------
// Patch merge — shared by updateRow and both setRow branches
// ---------------------------------------------------------------------------

/**
 * Merges a partial patch onto a row's current content, running
 * `normalizePatch` first if supplied.
 *
 * CONTRACT (documented at `StructuredRowsOptions.normalizePatch`'s own doc
 * site too): the value `normalizePatch` returns REPLACES `patch` entirely
 * here — `{ ...current, ...normalizePatch(current, patch) }` — it does not
 * additionally merge with `patch`. A `normalizePatch` that returns only its
 * own derived fields and omits the incoming `patch`'s fields silently drops
 * the clinician's own edit; it must start from `{ ...patch, ... }` (or
 * return `patch` unchanged when there is nothing to derive). Verified by
 * execution: `rowMutations.test.ts`'s "CONTRACT PIN" case reproduces the
 * drop.
 */
export function mergePatch<TRow extends object>(
  current: TRow,
  patch: Partial<TRow>,
  normalizePatch?: (row: TRow, patch: Partial<TRow>) => Partial<TRow>,
): TRow {
  const derived = normalizePatch ? normalizePatch(current, patch) : patch;
  return { ...current, ...derived } as TRow;
}

// ---------------------------------------------------------------------------
// removeRow / clearRow — annex §7's three-outcome dispatch
// ---------------------------------------------------------------------------

/**
 * Decides what `removeRow(rowId)` (and, for the singleton's `clearRow`,
 * the equivalent decision over `rows[0]`) actually records — annex §7's
 * "one user-facing affordance, three outcomes", the exact logic duplicated
 * across five legacy editors:
 *
 *  - A baseline row with `softDelete` configured ⇒ an ordinary `update`
 *    carrying the marker merged onto the row's CURRENT content (its
 *    already-edited content if it has one, not the stale server row) — the
 *    row stays on screen, `softDeleted`, and un-removing later is just
 *    another update. See `SoftDeleteDescriptor`'s doc comment (`./types`).
 *  - Anything else (an added row — annihilated by the reducer, since it
 *    never reached the server — or a baseline row of a type with true
 *    delete semantics, or no `softDelete` configured at all) ⇒ `remove`,
 *    carrying the row's last-known content in `patch`, per the canonical
 *    vocabulary's `remove` contract.
 *
 * NOTE — the loading-window divergence from the annex, pinned by test: a
 * `ProjectedRow` synthesized by `projectRows`'s step 3 (`baseline ===
 * undefined`, an unresolved `update` rendered as a presumed row — see
 * `projectRows.ts`) carries `origin: "baseline"`, matching an ordinary
 * fetched baseline row. If `removeRow` fires on such a row while `softDelete`
 * is configured, this function records a soft-delete `update`, not a hard
 * `remove` — the annex's draft (written before the BASELINE COMPLETENESS
 * CONTRACT existed) has no equivalent "presumed row" concept and would have
 * had nothing to consult here. Arguably the more correct outcome (a
 * clinician acting on a row they believe is real shouldn't have their
 * "remove" silently escalate to a hard delete the instant baseline loads
 * and turns out to agree with them) — `rowMutations.test.ts`'s "loading
 * window" case exercises it end-to-end through the real `projectRows`.
 */
export function resolveRemoveIntent<TRow extends object>(
  entry: ProjectedRow<TRow>,
  softDelete: SoftDeleteDescriptor<TRow> | undefined,
): RowEdit<TRow> {
  if (entry.origin === "baseline" && softDelete) {
    return {
      rowId: entry.rowId,
      op: "update",
      patch: { ...entry.row, ...softDelete.patch },
    };
  }
  return { rowId: entry.rowId, op: "remove", patch: entry.row };
}

// ---------------------------------------------------------------------------
// setRow — annex §9's three-route dispatch
// ---------------------------------------------------------------------------

export interface ResolveSetRowInput<TRow extends object> {
  /** `rows[0]?.row` — the singleton's current content, if any row exists
   *  yet (baseline row, or an `add` already recorded). */
  currentRow: TRow | undefined;
  /** `rows[0]?.rowId`. Always defined exactly when `currentRow` is. */
  currentRowId: RowId | undefined;
  patch: Partial<TRow>;
  /** Required when no row exists yet — a create-only singleton's very
   *  first `setRow` call. */
  createSeed: (() => TRow) | undefined;
  singletonRowId: RowId;
  normalizePatch?: (row: TRow, patch: Partial<TRow>) => Partial<TRow>;
  /** For the thrown error's message only, when `createSeed` is required
   *  but missing. */
  questionId: string;
}

/**
 * Decides what `setRow(patch)` records — annex §9:
 *
 *  1. A row already exists (baseline row present, or an `add` already
 *     recorded) ⇒ an ordinary `update` against ITS rowId. `editLog.ts`'s
 *     own coalescing is what keeps this an `add` if that is what the
 *     existing log entry already is (`coalesceOntoAdd` never re-labels);
 *     this function does not need to know or care which.
 *  2. No row yet at all ⇒ the first-ever creation of a create-only
 *     singleton (`appointment`, `time_of_death`). `createSeed` is a
 *     required precondition for this route — enforced here (a caller
 *     misconfiguration is a hard, immediate throw, not a silently
 *     swallowed no-op), pinned by `rowMutations.test.ts`'s
 *     `assert.throws` case.
 */
export function resolveSetRow<TRow extends object>(
  input: ResolveSetRowInput<TRow>,
): RowEdit<TRow> {
  const {
    currentRow,
    currentRowId,
    patch,
    createSeed,
    singletonRowId,
    normalizePatch,
    questionId,
  } = input;

  if (currentRow !== undefined && currentRowId !== undefined) {
    return {
      rowId: currentRowId,
      op: "update",
      patch: mergePatch(currentRow, patch, normalizePatch),
    };
  }

  if (!createSeed) {
    throw new Error(
      `useStructuredRows(${questionId}): mode:"single" with no baseline row requires createSeed`,
    );
  }
  const seed = createSeed();
  return {
    rowId: singletonRowId,
    op: "add",
    patch: mergePatch(seed, patch, normalizePatch),
  };
}

// ---------------------------------------------------------------------------
// initialEdits — the one-shot seed's latch decision
// ---------------------------------------------------------------------------

/**
 * Decides what `useStructuredRows`'s one-shot `initialEdits` seed effect
 * should do THIS render — the fix for the review finding on `3b41fe4fd`:
 * the effect used to latch (`seeded.current = true`) unconditionally on
 * its very first run, before checking whether `initialEdits` had actually
 * arrived yet. Under the canonical vocabulary `patch` is the COMPLETE row,
 * so a seed that patches a baseline row (e.g. encounter's
 * `?toDischarge=true`, `{ ...toEncounterRow(encounter), status:
 * DISCHARGED }`) cannot be CONSTRUCTED by the caller until the baseline
 * query resolves — `initialEdits` is necessarily `undefined` on the first
 * render. The old effect ran once, saw nothing to seed, latched forever,
 * and the intent was dropped permanently the moment `initialEdits` later
 * became available. (The annex's own draft worked here only because its
 * pre-canonical vocabulary allowed a PARTIAL update patch, constructible
 * with no baseline at all — the translation to the shipped full-row
 * vocabulary is what broke this, not a copying error.)
 *
 * Three outcomes:
 *  - `"skip"` — `edits` already has content (a restored draft, or any
 *    other prior activity). The seed decision is FINAL: never seed,
 *    regardless of what `initialEdits` does later. "A restored draft
 *    always wins."
 *  - `"wait"` — `edits` is still empty AND `initialEdits` has no content
 *    yet. Do NOT latch — try again on a future render, once
 *    `initialEdits` either arrives or `edits` gains content some other
 *    way.
 *  - `"seed"` — `edits` is empty and `initialEdits` has content: apply it
 *    now, then latch (the caller is responsible for setting the one-shot
 *    ref only on `"skip"`/`"seed"`, never on `"wait"`).
 */
export type InitialEditsSeedDecision = "seed" | "wait" | "skip";

export function decideInitialEditsSeed<TRow extends object>(
  edits: EditLog<TRow>,
  initialEdits: EditLog<TRow> | undefined,
): InitialEditsSeedDecision {
  if (edits.length > 0) return "skip";
  if (!initialEdits?.length) return "wait";
  return "seed";
}
