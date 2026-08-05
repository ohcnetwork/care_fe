import type {
  EditLog,
  ProjectedRow,
  RowEdit,
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * The domain decisions behind `useStructuredRows`'s `updateRow`/`setRow`/
 * `removeRow`/`clearRow` mutators and its one-shot `initialEdits` seed —
 * pure functions, so the branching lives outside the hook where it is
 * unit-testable without a DOM (`rowMutations.test.ts`).
 */

// ---------------------------------------------------------------------------
// Patch merge — shared by updateRow and both setRow branches
// ---------------------------------------------------------------------------

/**
 * CONTRACT: `normalizePatch` returns its DERIVED FIELDS ONLY — they land
 * on top of the clinician's `patch`, which is applied whether or not a
 * normalizer exists. A normalizer therefore cannot drop an edit by
 * omission; it can only override a field it names deliberately.
 */
export function mergePatch<TRow extends object>(
  current: TRow,
  patch: Partial<TRow>,
  normalizePatch?: (row: TRow, patch: Partial<TRow>) => Partial<TRow>,
): TRow {
  // Spreading `undefined`/`null` contributes nothing, so a plugin
  // definition returning either across the `unknown` boundary — type-
  // illegal, but reachable at runtime — degrades to "no derivation"
  // rather than to a lost edit.
  return { ...current, ...patch, ...normalizePatch?.(current, patch) } as TRow;
}

// ---------------------------------------------------------------------------
// removeRow / clearRow
// ---------------------------------------------------------------------------

/**
 * Decides what `removeRow(rowId)` (and the singleton's `clearRow`, over
 * `rows[0]`) records — one user-facing affordance, two outcomes:
 *
 *  - A baseline row with `softDelete` configured ⇒ an ordinary `update`
 *    carrying the marker merged onto the row's CURRENT (possibly already
 *    edited) content — the row stays on screen, `softDeleted`, and
 *    un-removing later is just another update.
 *  - Anything else (an added row — annihilated by the reducer, it never
 *    reached the server — or a type with true delete semantics, or no
 *    `softDelete` configured) ⇒ `remove`, carrying the row's last-known
 *    content in `patch`.
 *
 * Loading-window note: a row synthesized while `baseline` is `undefined`
 * carries `origin: "baseline"`, so removing it with `softDelete`
 * configured records a soft-delete `update`, not a hard `remove` — a
 * clinician acting on a row they believe is real shouldn't have their
 * remove escalate to a hard delete the instant the baseline loads and
 * agrees with them.
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
// setRow
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
 * Decides what `setRow(patch)` records:
 *
 *  1. A row already exists (baseline row present, or an `add` already
 *     recorded) ⇒ an ordinary `update` against ITS rowId; the reducer's
 *     coalescing keeps it an `add` when that is what the existing entry
 *     is — this function needn't know which.
 *  2. No row yet ⇒ the first-ever creation of a create-only singleton.
 *     `createSeed` is required here: a missing one is a caller
 *     misconfiguration and throws immediately rather than silently
 *     no-oping.
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
 * Decides what the one-shot `initialEdits` seed effect should do THIS
 * render. Because `patch` is the COMPLETE row, a seed that patches a
 * baseline row (e.g. encounter's `?toDischarge`) cannot be constructed
 * until the baseline query resolves — `initialEdits` is necessarily
 * `undefined` on the first render, so latching unconditionally on the
 * first run would drop the intent permanently.
 *
 * Three outcomes:
 *  - `"skip"` — `edits` already has content (a restored draft, or any
 *    prior activity). Final: never seed. A restored draft always wins.
 *  - `"wait"` — `edits` empty AND `initialEdits` has no content yet. Do
 *    NOT latch; try again on a future render.
 *  - `"seed"` — `edits` empty, `initialEdits` has content: apply now,
 *    then latch. (The caller latches only on `"skip"`/`"seed"`, never on
 *    `"wait"`.)
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
