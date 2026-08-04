import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useQuestionResponse,
  useSetQuestionProjection,
} from "@/components/QuestionnaireV2/form/engine/store";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";
import { sanitizeStructuredEditLog } from "@/types/questionnaire/structured";

import { deepEqualJson } from "./deepEqual";
import { findDuplicateCandidates } from "./duplicates";
import {
  applyEditToLog,
  toBaselineMap,
  type ApplyEditOptions,
} from "./editLog";
import {
  findOrphanRowIds,
  projectRows,
  pruneOrphanEdits,
  truncateToSingletonRow,
} from "./projectRows";
import { newRowId, SINGLETON_ROW_ID } from "./rowIds";
import {
  decideInitialEditsSeed,
  mergePatch,
  resolveRemoveIntent,
  resolveSetRow,
} from "./rowMutations";
import type {
  BaselineRow,
  EditLog,
  ProjectedRow,
  ProjectValues,
  RowEdit,
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * The React wrapper over Tasks 2–5's pure state core. Per the plan's
 * non-negotiable rule (`2026-08-04-phase1-core-kit.md` §3 / task-7-brief.md):
 * **this file contains no branching logic** — every decision (coalesce,
 * canonicalize, project, order, resolve, duplicate-check, the mutator
 * dispatches, the one-shot seed's latch decision) is delegated to a pure,
 * `node:test`-covered sibling (`editLog.ts`, `projectRows.ts`,
 * `duplicates.ts`, `rowMutations.ts`, `rowIds.ts`). What remains here is
 * wiring: reading and writing one question's response through the form
 * store, memoizing the pure functions' inputs/outputs, and picking which of
 * the two controller shapes (`list/single`) to return. The guard clauses
 * below (`if (disabled) return`, the seed/refresh effects' one-shot ref
 * checks) are precondition checks, not domain decisions — the annex's own
 * §10 reference implementation has the identical shape of clauses and is
 * the one this file translates from.
 *
 * Design source: `docs/superpowers/specs/annexes/p1-state-core.md` §10
 * (hook API + reference body), §13 (list type worked example), §14
 * (singleton), §15 (create-only singleton) — translated per the plan's
 * CANONICAL EDIT VOCABULARY table (`rowId` not `row_id`, `patch: TRow`
 * always the complete row, no `StructuredRowEdit`/`edits.ts`). Deliberate
 * departures from the annex's draft, beyond vocabulary:
 *
 *  1. **CARRY-FORWARD CLOSED (final push, Batch E item 5b).** The original
 *     Task 7 draft of this file deliberately deviated from the annex here:
 *     its §10 body adds a `useSetQuestionProjection` atom (a
 *     projection-only write that skips `clearQuestionErrorsInState`, so a
 *     background baseline refetch cannot wipe a submit-time error), but
 *     Task 7's territory was `structured/core/*` only — `form/engine/
 *     store.ts` was out of bounds, so both this hook's writes went through
 *     the existing `useQuestionResponse` setter, which DOES clear the
 *     question's errors on every write, including the passive
 *     baseline-driven refresh effect below. That gap is now closed:
 *     `useSetQuestionProjection` (`form/engine/store.ts`) is the
 *     projection-only setter the annex called for, and the passive refresh
 *     effect below writes through IT instead of `updateResponse` — a
 *     background refetch can no longer clear a showing server error while
 *     the offending value is still on screen. Every MUTATOR-driven write
 *     (`commit`, called from `applyEdit`/`addRow`/`updateRow`/`removeRow`/
 *     `setRow`/`clearRow`/the orphan-prune effect/the initial-edits seed)
 *     still goes through `updateResponse` deliberately — those are real
 *     user (or seed) intent and clearing this question's prior errors on
 *     an actual edit is correct, same as every other question type.
 *  2. **The passive refresh effect below compares `values` structurally
 *     (`deepEqualJson`) against the response's OWN current `values`** —
 *     not a `lastWritten` ref, and not by reference — for two reasons
 *     found by review on `3b41fe4fd`: (a) the annex's own "Risk —
 *     projection write loop" note (§18): `commit` already writes `values`
 *     once; the following render recomputes an equal-content but
 *     new-reference `values` array via the `rows`/`values` memos, and a
 *     reference-only guard would fire one redundant extra atom write (and
 *     error-clear) per edit; (b) a ref-based guard that starts `undefined`
 *     ALWAYS treats the very first run as "changed" regardless of whether
 *     `response.values` already matches — wiping that question's errors on
 *     every mount, including an `enable_when` remount where nothing
 *     actually changed. Comparing against `response?.values` directly
 *     fixes both: it is the actual current atom content on every render,
 *     first included, so a no-op mount and a `commit`-driven re-render
 *     both correctly compare equal and skip the write.
 *  3. **Orphan rowIds are exposed** (`StructuredRowsBase.orphanRowIds`),
 *     computed by `projectRows.ts`'s `findOrphanRowIds` — spec amendment
 *     A1 / task-7-brief.md obligation 2. The annex predates this
 *     obligation and has no equivalent field.
 *  4. **A passive effect prunes confirmed orphans out of `edits`, into
 *     `droppedEdits`** (Phase 2 carry-forward fix, see that effect's own
 *     doc comment below for the full argument): once `baseline` is a known
 *     array and `orphanRowIds` is non-empty, every matching entry is
 *     appended to `droppedEdits` (`StructuredRowsBase.droppedEdits`, a
 *     `useState`) BEFORE `commit(pruneOrphanEdits(baseline, edits))` drops
 *     it from `edits` — no annex equivalent, since the annex predates
 *     `findOrphanRowIds` entirely.
 *  5. **`edits` is read through `sanitizeStructuredEditLog`** (`types/
 *     questionnaire/structured.ts`), not a bare cast of `response?.edits`
 *     (CARRY-FORWARD CLOSED, final push, Batch E item 5a). A restored
 *     draft's log is validated per-entry (`isStructuredEditRecord`) but
 *     never de-duplicated by `rowId` before reaching this hook, while
 *     `fill/submit/composeStructured.ts`'s `structuredEditsOf` — the submit
 *     path's reader of the SAME `response.edits` field — already ran the
 *     identical sanitization. A doubly-malformed log (two entries sharing
 *     one `rowId`) fed unsanitized to `projectRows` could therefore show a
 *     different row than a sanitized log would submit
 *     (`structured/types/appointment/model.test.ts`'s former "KNOWN GAP"
 *     case, now closed). Routing this hook's own read through the same
 *     gate means both `projectRows` (display) and `resolveChanges` (submit,
 *     via `structuredEditsOf`) always start from an IDENTICAL, already
 *     well-formed log — the disagreement becomes unreachable by
 *     construction rather than by reconciling the two loops' internal
 *     ordering rules (see `sanitizeStructuredEditLog`'s own doc comment).
 *  6. **`mode: "single"` truncates `values`/the committed log to at most
 *     `rows[0]`'s rowId** (CARRY-FORWARD CLOSED, final push, Batch E item
 *     5c) via `commit`'s call to `projectRows.ts`'s
 *     `truncateToSingletonRow`. Previously `commit` wrote whatever log a
 *     mutator (or the `initialEdits` seed) constructed verbatim, even
 *     though `SingleRowController.row` only ever shows `rows[0]` — a
 *     singleton that legitimately accumulates a second rowId (e.g. an
 *     `initialEdits` seed recorded under `singletonRowId` before a
 *     REAL baseline row, keyed by its own different id, resolves) would
 *     silently SUBMIT two rows while the clinician only ever saw one.
 *     Unreachable for every type shipped so far (each singleton's baseline
 *     rowId and `singletonRowId` option already agree), but closed by
 *     construction rather than left as a latent trap for the next one. See
 *     `truncateToSingletonRow`'s own doc comment for the full argument.
 *
 * CAVEAT for every mutator (`applyEdit`/`addRow`/`addRows`/`updateRow`/
 * `removeRow`/`setRow`/`clearRow`/`resetEdits`): each reads `edits` from
 * this render's closure. Two mutator calls issued synchronously in the same
 * event handler (before React re-renders) both read the SAME `edits` value
 * — the second call's `commit` overwrites the first's, so the first change
 * is lost. `addRows` is the one mutator that covers this for its own
 * "known batch" case (adding several rows in one call folds every edit into
 * one `EditLog` before a single `commit`); a caller needing to combine
 * heterogeneous operations (e.g. one `updateRow` and one `removeRow`) in a
 * single handler has no equivalent today and must call `applyEdit` in a
 * loop over a manually-folded log instead of calling two mutators back to
 * back.
 */

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface StructuredRowsOptions<TRow extends object> {
  /** The question this row set belongs to — the hook reads and writes that
   *  question's response in the form store directly. */
  questionId: string;

  /**
   * Server rows, already converted and keyed by the type module's
   * converter. The hook NEVER fetches.
   *
   * BASELINE COMPLETENESS CONTRACT (binding — `2026-08-04-phase1-core-kit.md`
   * Global Constraints, task-7-brief.md obligation 1): this must be either
   * the COMPLETE fetched server-row set, or `undefined` while the baseline
   * query is loading or has errored — **never `[]` standing in for
   * "loading"**. `[]` is a real, meaningful value: "the server confirmed
   * this section has zero rows" (the honest state for `service_request`,
   * `charge_item`, `files`, `appointment`, `time_of_death`, which never
   * have a baseline at all). Passing `[]` while a fetch is merely in
   * flight wrongly resolves a coalesced edit's add-vs-update op
   * (`editLog.ts`'s `resolveOpAgainstBaseline`) and hides a restored
   * draft's pending edit from display (`projectRows.ts`'s orphan rule) —
   * the `f321cb379` hazard. `undefined` is passed through to both
   * `applyEditToLog` and `projectRows` unchanged; see their doc comments
   * for what each does with it.
   */
  baseline?: readonly BaselineRow<TRow>[];

  /** Projection → `values`. Must be referentially stable (declare it at
   *  module scope in `model.ts`); the hook memoizes on it. Empty
   *  projection MUST produce `[]`, so an emptied section reads unanswered
   *  to `entryHasContent` (`form/engine/store.ts:372-376`). */
  projectValues: ProjectValues<TRow>;

  mode?: "list" | "single";

  softDelete?: SoftDeleteDescriptor<TRow>;
  duplicateKey?: (row: TRow) => string | undefined;
  displayOrder?: (a: TRow, b: TRow) => number;

  /**
   * Domain derivation applied to every patch BEFORE it is recorded — the
   * replacement for `encounter`'s two write-during-effect loops. Pure, so
   * it is unit-testable and cannot loop.
   *
   * RETURN CONTRACT (verified by execution — `rowMutations.test.ts`'s
   * "CONTRACT PIN" case): the returned `Partial<TRow>` REPLACES `patch`
   * entirely before being spread onto the current row
   * (`{ ...row, ...normalizePatch(row, patch) }`, see `rowMutations.ts`'s
   * `mergePatch`) — it is NOT additionally merged with `patch`. A
   * `normalizePatch` that returns only ITS OWN derived fields and omits
   * `patch`'s incoming fields silently DROPS the clinician's own edit.
   * Always start from `{ ...patch, ...derivedFields }` (or return `patch`
   * unchanged when there is nothing to derive) — never
   * `{ ...derivedFieldsOnly }` alone. `encounter`'s reference
   * `normalizePatch` (annex §14) follows this: `const out: Partial<Row> =
   * { ...patch }; ... return out;`.
   */
  normalizePatch?: (row: TRow, patch: Partial<TRow>) => Partial<TRow>;

  /** An ADDED row that satisfies this after an update replaces its patch is
   *  annihilated (appointment's clear-to-empty). Wired into
   *  `editLog.ts`'s `add`+`update` coalescing cell — see that module. */
  isEmptyRow?: (row: TRow) => boolean;

  /** Required for `mode: "single"` when no baseline row exists yet (a
   *  create-only singleton — `appointment`, `time_of_death`). */
  createSeed?: () => TRow;
  /** Defaults to `SINGLETON_ROW_ID`. */
  singletonRowId?: RowId;

  /**
   * Seeded ONCE, on first mount, and only when the log is empty — so a
   * restored draft always wins. This is where `encounter`'s
   * `?toDischarge=true` lives: an explicit, dirty-making user intent
   * recorded as a real edit instead of being smuggled into the baseline
   * seed.
   */
  initialEdits?: EditLog<TRow>;

  /** Submit freeze (P1-4): every mutator no-ops. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

export interface StructuredRowsBase<TRow extends object> {
  edits: EditLog<TRow>;
  /** Derived, never stored: `edits.length > 0`. */
  isDirty: boolean;
  /** Restored edits whose baseline row has vanished server-side (spec
   *  amendment A1), computed live from `(baseline, edits)` by
   *  `projectRows.ts`'s `findOrphanRowIds`.
   *
   *  SELF-CLEARS — READ THIS BEFORE BUILDING A NOTICE ON IT. The passive
   *  prune effect below (Phase 2 carry-forward fix) excises every rowId
   *  this reports from `edits` as soon as it detects them — same render
   *  pass baseline resolves, or the next one — so this is non-empty for at
   *  most one render per detected orphan and is EMPTY AGAIN immediately
   *  after. It is NOT a durable "N restored edits could not be applied"
   *  count. A restore-notice UI (spec amendment A1, owner Phase 5) must
   *  read {@link StructuredRowsBase.droppedEdits} instead — the mount-
   *  lifetime-durable record of the same rowIds, WITH their `patch` — for
   *  anything that needs to outlive that single render. */
  orphanRowIds: readonly RowId[];
  /** Every edit ever pruned as a confirmed orphan THIS MOUNT, in the order
   *  encountered, accumulated across every prune the passive effect below
   *  runs. This is what spec amendment A1's restore notice (Phase 5) is
   *  meant to read: unlike `orphanRowIds` (which self-clears the moment the
   *  prune it names has happened), this retains each dropped edit's full
   *  `patch` — the only surviving copy of what the clinician actually
   *  typed, since the prune removes it from `edits` and a subsequent
   *  autosave would otherwise carry that removal straight into the stored
   *  draft with nothing left to name.
   *
   *  DURABILITY SCOPE: mount-lifetime only. A remount (an `enable_when`
   *  toggle hiding then re-showing this question, navigating away and
   *  back) resets this to `[]`, same as any other `useState`. Persisting
   *  dropped edits so a notice survives a full page reload is Phase 5's
   *  scope, not this hook's — it would need its own storage (e.g. folded
   *  into the draft dump), not an in-memory list.
   *
   *  ALSO CLEARED BY `resetEdits` (Discard): a clinician-initiated "forget
   *  everything I did this session" wipes this alongside `edits` — see
   *  `resetEdits`'s own doc comment for the reasoning. A restore-notice UI
   *  reading this field will see it go back to `[]` the instant the
   *  clinician discards, same as `edits` does. */
  droppedEdits: EditLog<TRow>;
  /** The raw seam — the assistant's `applyStructuredEdit` path (a later
   *  phase) and any caller needing to record an edit `useStructuredRows`
   *  doesn't otherwise expose a mutator for. */
  applyEdit: (edit: RowEdit<TRow>) => void;
  /** Drop all intent; the projection collapses back to the baseline. Also
   *  clears `droppedEdits` (see its own doc comment) — a Discard forgets
   *  the restore-notice record too, not just the live edit log. */
  resetEdits: () => void;
}

export type AddRowResult =
  { ok: true; rowId: RowId } | { ok: false; reason: "duplicate" | "disabled" };

export interface ListRowsController<
  TRow extends object,
> extends StructuredRowsBase<TRow> {
  rows: readonly ProjectedRow<TRow>[];
  addRow: (row: TRow) => AddRowResult;
  addRows: (rows: readonly TRow[]) => AddRowResult[];
  updateRow: (rowId: RowId, patch: Partial<TRow>) => void;
  removeRow: (rowId: RowId) => void;
  isDuplicate: (row: TRow) => boolean;
}

export interface SingleRowController<
  TRow extends object,
> extends StructuredRowsBase<TRow> {
  row: ProjectedRow<TRow> | undefined;
  setRow: (patch: Partial<TRow>) => void;
  clearRow: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * The annex's §10 signature is three overloads (one per mode, one
 * implementation). Not used here: this project's ESLint config applies the
 * base `no-redeclare` rule, which does not understand TS function overload
 * signatures and flags them as redeclarations — the same constraint
 * `contract.ts`'s `isV2Definition` doc comment already documents for the
 * identical reason. A conditional return type keyed on the `Mode` type
 * parameter gets the same call-site narrowing (`mode: "single"` in the
 * options literal narrows the return to `SingleRowController<TRow>`)
 * through one declaration instead of three.
 */
export type StructuredRowsController<
  TRow extends object,
  Mode extends "list" | "single",
> = Mode extends "single"
  ? SingleRowController<TRow>
  : ListRowsController<TRow>;

export function useStructuredRows<
  TRow extends object,
  Mode extends "list" | "single" = "list",
>(
  options: StructuredRowsOptions<TRow> & { mode?: Mode },
): StructuredRowsController<TRow, Mode> {
  const {
    questionId,
    baseline,
    projectValues,
    mode = "list",
    softDelete,
    duplicateKey,
    displayOrder,
    normalizePatch,
    isEmptyRow,
    createSeed,
    singletonRowId = SINGLETON_ROW_ID,
    initialEdits,
    disabled,
  } = options;

  const [response, updateResponse] = useQuestionResponse(questionId);
  // Projection-only write — see this file's doc comment, item 1 (CARRY-
  // FORWARD CLOSED): used by the passive baseline-refresh effect below so a
  // background refetch cannot clear this question's showing errors.
  const setProjection = useSetQuestionProjection(questionId);

  // Sanitized at the read boundary (item 5, this file's doc comment) — the
  // SAME gate `fill/submit/composeStructured.ts`'s `structuredEditsOf` runs
  // `response.edits` through for the submit path, so `projectRows` (below)
  // and `resolveChanges` (submit, via that other reader) always start from
  // an identical, already well-formed log.
  const edits = useMemo<EditLog<TRow>>(
    () => sanitizeStructuredEditLog(response?.edits) as EditLog<TRow>,
    [response?.edits],
  );

  // BASELINE COMPLETENESS CONTRACT: `baselineMap` stays `undefined` exactly
  // when `baseline` itself is — see `editLog.ts`'s `toBaselineMap` (the
  // tested implementation of this translation) and the `baseline` option's
  // own doc comment above.
  const baselineMap = useMemo<ReadonlyMap<RowId, TRow> | undefined>(
    () => toBaselineMap(baseline),
    [baseline],
  );

  const projectOpts = useMemo(
    () => ({ softDelete, displayOrder }),
    [softDelete, displayOrder],
  );
  const applyOpts = useMemo<ApplyEditOptions<TRow>>(
    () => ({ baseline: baselineMap, isEmptyRow }),
    [baselineMap, isEmptyRow],
  );

  // `rows` is derived synchronously from `(baseline, edits)` — a keystroke
  // paints in the same commit, unlike `values` (a mechanical mirror one
  // effect behind, below).
  const rows = useMemo(
    () => projectRows(baseline, edits, projectOpts),
    [baseline, edits, projectOpts],
  );

  const orphanRowIds = useMemo(
    () => findOrphanRowIds(baseline, edits),
    [baseline, edits],
  );

  const values = useMemo(
    () => projectValues(rows.map((entry) => entry.row)),
    [rows, projectValues],
  );

  // The one write that carries intent. `values` and `edits` land in a
  // single atom write so no consumer ever sees them disagree.
  //
  // SINGLETON TRUNCATION (this file's doc comment, item 6 — CARRY-FORWARD
  // CLOSED): for `mode: "single"`, `nextEdits` is run through
  // `truncateToSingletonRow` before anything derives from it, so `values`
  // and the persisted `edits` can never carry a second rowId that
  // `SingleRowController.row` (always `rows[0]`) never showed the
  // clinician in the first place. A no-op for every log with 0 or 1
  // rowIds (every real singleton today), by that function's own
  // reference-equality return contract.
  const commit = useCallback(
    (nextEdits: EditLog<TRow>) => {
      const effectiveEdits =
        mode === "single"
          ? truncateToSingletonRow(baseline, nextEdits, projectOpts)
          : nextEdits;
      const nextRows = projectRows(baseline, effectiveEdits, projectOpts);
      const nextValues = projectValues(nextRows.map((entry) => entry.row));
      updateResponse({
        values: nextValues,
        edits: effectiveEdits as unknown as StructuredEditRecord[],
      });
    },
    [baseline, projectOpts, projectValues, mode, updateResponse],
  );

  // Baseline moved (first load, refetch, invalidation): refresh the
  // DISPLAY mirror only. Never touches `edits`. Compared structurally
  // (`deepEqualJson`) against the response's OWN current `values` — not a
  // `lastWritten` ref — so this is correct on EVERY render including the
  // first: a `commit`-driven re-render's freshly recomputed `values` is
  // content-equal (but not reference-equal) to what `commit` already wrote,
  // and an `enable_when` remount whose `response.values` already matches
  // the freshly computed projection is likewise a no-op — neither writes
  // again, so neither clears this question's errors. See this file's doc
  // comment, item 2, for the two review findings this fixes. Writes
  // through `setProjection` (item 1, CARRY-FORWARD CLOSED), not
  // `updateResponse` — this is a PASSIVE mirror of baseline movement, not
  // user intent, so it must not clear this question's showing errors.
  useEffect(() => {
    if (deepEqualJson(response?.values, values)) return;
    setProjection(values);
  }, [response?.values, values, setProjection]);

  // PHASE 2 CARRY-FORWARD FIX (master plan "Carry-forwards out of Phase 1"
  // item 1 — owner: Phase 2, before the first v2 type ships): a rowId
  // `findOrphanRowIds` confirms the (complete, known) baseline no longer
  // has must never sit in `response.edits` — the ONLY thing
  // `composeStructuredV2Requests` (`fill/submit/composeStructured.ts`)
  // reads and forwards, verbatim, to a type's `toRequests`. That compose
  // seam cannot filter this itself: `toRequests(edits, ctx)` never
  // receives a baseline, by design (see `pruneOrphanEdits`'s doc comment,
  // `./projectRows`, for the full "why not at compose" argument and the
  // evidence behind it). This hook is the one place `baseline` and `edits`
  // are ever held together, so pruning has to happen here, reactively —
  // same trigger as the `values`-refresh effect above (baseline moved),
  // because the realistic failure is passive: a restored draft's edit
  // targets a row that vanished server-side, baseline resolves and
  // confirms it, and the clinician never touches this section again
  // before hitting submit. Guarded on `orphanRowIds` (empty while
  // `baseline` is `undefined` — loading/errored is not confirmed-gone, so
  // this never fires during that window) so it converges in one pass: the
  // resulting `commit` drops exactly those rowIds from `edits`, which
  // recomputes `orphanRowIds` to `[]` on the next render.
  //
  // POST-REVIEW FIX — the prune must not destroy the only record of what
  // it removed. The first version of this effect called
  // `commit(pruneOrphanEdits(baseline, edits))` and nothing else: that
  // deletes spec amendment A1's data at the exact moment it becomes
  // knowable, in memory AND on disk (`commit` → `updateResponse` →
  // whatever persists `response.edits` into a local/server draft), and
  // does it after exactly ONE render — before any remount, before any
  // autosave, before a later phase's restore-notice UI could ever read it.
  // `droppedEdits` (`useState` below) is the fix: every rowId `edits`
  // filtered against `orphanSet` (computed once, reused for both) is
  // appended there BEFORE `commit` removes it from `edits` — same
  // convergence shape as the prune itself (see below), just also
  // accumulating instead of only filtering. This is what makes the A1
  // restore notice actually buildable later without every v2 editor (all
  // eleven of them) separately racing to capture `orphanRowIds` in the one
  // render window before this effect clears it.
  //
  // `droppedEdits` is mount-lifetime durable, not session-durable — see
  // its own doc comment on `StructuredRowsBase` for that boundary and why
  // crossing it is explicitly left to Phase 5.
  //
  // Deliberately NOT gated on `disabled` (unlike every mutator below):
  // `disabled` (P1-4's submit freeze) exists to block NEW user intent from
  // being recorded mid-submit, but this effect records none — it only
  // excises intent the baseline has already proven stale. Gating it would
  // only reopen the exact race this fix closes (freeze engages the instant
  // baseline resolves, the prune never runs, the orphan reaches submit
  // anyway); in the ordinary timeline baseline resolves long before a
  // clinician reaches Save, so this has already run by then regardless.
  //
  // POST-REVIEW FIX — StrictMode double-invocation double-counts.
  // `commit(pruneOrphanEdits(baseline, edits))` is idempotent under
  // StrictMode's dev-only double-invoke-effects behavior (`src/index.tsx`
  // renders the whole app in `<StrictMode>`): both invocations read the
  // SAME `(baseline, edits)` closure and produce the identical pruned
  // result, so `response.edits` ends up correct regardless of how many
  // times it runs. The functional `setDroppedEdits` updater was NOT
  // idempotent the same way: invocation 1 appends the dropped edit to `[]`;
  // invocation 2 runs before any new render has occurred (so `edits` is
  // STILL the pre-prune closure) but `previous` inside the updater already
  // reflects invocation 1's write, and the naive version appended the SAME
  // edit a second time — `droppedEdits.length` would overcount exactly the
  // count a Phase 5 notice exists to report correctly. Fixed by skipping
  // any rowId `previous` already carries, and returning `previous` itself
  // (not a new array) when nothing new survives that filter, so a second,
  // idempotent invocation is a true no-op — no state write, no re-render —
  // not just a same-content one.
  const [droppedEdits, setDroppedEdits] = useState<EditLog<TRow>>([]);
  useEffect(() => {
    // NOT MERELY AN OPTIMIZATION — this early return is the ONLY thing
    // standing between an unmemoized `baseline` and an unbounded render
    // loop. `commit` (below) has no deep-equality bail-out of its own: it
    // unconditionally calls `updateResponse`, which unconditionally
    // constructs a fresh response object and writes it — so if this guard
    // were removed, EVERY render in which `orphanRowIds`'s reference
    // changed would commit, and every commit is itself a state write that
    // triggers another render. That is harmless when `baseline` is
    // memoized (its reference is stable, so `orphanRowIds` only changes
    // reference when its CONTENT does) — but `baseline` is caller-supplied
    // (`StructuredRowsOptions.baseline`, typically `data?.results.map(...)`
    // off a query result) and nothing in this hook enforces that the
    // caller memoizes it. An unmemoized baseline recomputes to a fresh
    // array identity on every render regardless of content, which forces
    // `orphanRowIds`'s own `useMemo` to recompute (and hand back a new
    // array reference, even when the CONTENT is unchanged, e.g. still
    // `[]`) on every render too — without this guard, that alone is
    // sufficient to commit, re-render, and commit again, forever. Executed
    // proof (POST-REVIEW): a build with this line removed and an
    // unmemoized, orphan-free baseline produced thousands of React's
    // "Maximum update depth exceeded" warnings in a run this file's own
    // "baseline undefined must never prune" case still passed —
    // `findOrphanRowIds(undefined, …)` trivially returning `[]` makes that
    // one assertion true whether or not this guard exists, which is why a
    // SEPARATE case below pins actual write COUNT, not just final content,
    // specifically for the `baseline === undefined` case this guard's
    // surrounding comment names; the general unmemoized-non-undefined loop
    // is documented here rather than reproduced as a permanent automated
    // test, since deliberately reproducing an unbounded render loop is
    // itself a hang risk for the suite that runs it.
    if (orphanRowIds.length === 0) return;
    const orphanSet = new Set(orphanRowIds);
    setDroppedEdits((previous) => {
      const alreadyDropped = new Set(previous.map((edit) => edit.rowId));
      const additions = edits.filter(
        (edit) => orphanSet.has(edit.rowId) && !alreadyDropped.has(edit.rowId),
      );
      return additions.length === 0 ? previous : [...previous, ...additions];
    });
    commit(pruneOrphanEdits(baseline, edits));
  }, [orphanRowIds, baseline, edits, commit]);

  // Declarative one-shot seed (e.g. encounter's `?toDischarge`). The latch
  // decision itself is `decideInitialEditsSeed` (`rowMutations.ts`) — see
  // its doc comment for the bug this fixes (post-`3b41fe4fd` review): the
  // ref must NOT latch while `initialEdits` simply hasn't arrived yet
  // (`"wait"`), only once the log already has content (`"skip"`) or
  // `initialEdits` finally does (`"seed"`) — otherwise a seed constructed
  // from baseline data that resolves after mount (every real seed under the
  // canonical full-row vocabulary) is silently dropped forever.
  //
  // THE ACTUAL WRITE IS DEFERRED ONE MICROTASK — fixes a real product
  // defect Phase 2 Task 10's Playwright matrix pinned with `test.fail()`
  // (`encounterStructured.spec.ts`, "?toDischarge=true seeds a dirty,
  // discharged row on mount"): the seed landed in the edit log, but
  // dirty-tracking (`fill/draft/useFillAutosave.ts`'s subscription effect,
  // an ANCESTOR — `QuestionnaireFillPage.tsx` mounts it well above this
  // hook's caller) never saw it, so the "Draft" chip never lit and Cancel
  // navigated away with no unsaved-changes warning after a pre-seeded
  // discharge — silently losing a real, already-timestamped edit
  // (`period.end` is stamped at seed time).
  //
  // VERIFIED BY EXECUTION, not assumed: instrumented both this effect and
  // the autosave subscription effect with `console.log(performance.now())`
  // and ran the Playwright spec. The trace showed the seed's `commit(...)`
  // landing (t=571.5ms) strictly BEFORE the autosave effect's very FIRST
  // baseline snapshot (t=573.1ms) — not merely before some LATER
  // comparison. `store.sub(responsesAtom, ...)` was never even invoked for
  // this write; the subscription simply didn't exist yet when the write
  // happened. This is React's own invariant: effects fire bottom-up
  // (child before parent) on mount, and `useStructuredRows` is always
  // called from a component strictly BELOW whatever establishes the
  // fill session's dirty subscription. No ordinary same-frame `useEffect`
  // placement can flip that — the fix has to make the write happen
  // strictly AFTER the CURRENT synchronous effect-flush pass (which
  // includes every ancestor effect due to run this pass) has completed.
  //
  // `queueMicrotask` does exactly that: React's post-commit effect flush
  // (child effects, then parent effects, including any effect-triggered
  // re-renders it resolves synchronously before yielding) runs as ONE
  // continuous synchronous JavaScript call; a microtask queued partway
  // through cannot preempt it and can only run once that whole call stack
  // unwinds — strictly after every ancestor's effect this pass, whatever
  // depth it's at. Microtasks also drain before the browser's next paint —
  // the row still reads "Discharged" from the first frame, same as before
  // this fix (the paint-timing itself is unchanged; a DefaultLane update
  // through React's Scheduler resolves before paint in both the deferred
  // and the non-deferred case — the fix only changes WHICH pass observes
  // the write, not when it becomes visible). `seeded.current` is still
  // flipped SYNCHRONOUSLY inside the effect body (immediately, not after
  // the microtask), so the one-shot latch and its StrictMode
  // double-invoke safety are unaffected — only the ACTUAL WRITE moves
  // later, not the decision to seed.
  //
  // THE SECOND PREMISE THIS FIX RESTS ON, named explicitly rather than
  // left implicit (post-review): landing after every ancestor effect this
  // pass is necessary but not sufficient — at the moment the microtask
  // drains, a LIVE subscription must already exist whose baseline
  // predates the seed. That holds today because
  // `fill/draft/useFillAutosave.ts`'s subscription effect resolves each
  // form's store via `getStore`, which reads through a REF
  // (`QuestionnaireFillPage.tsx`'s `storesRef` — a `useRef(new Map())`),
  // not through the `storesVersion` STATE that merely triggers the
  // effect to re-run. So the very FIRST time that effect runs at all —
  // same synchronous pass as this one, no render behind — it already sees
  // the correct, current, durable store object and subscribes to it
  // immediately; there is no window where zero subscription exists on a
  // render where this hook's effects have already run. If dirty-tracking
  // ever subscribed by keying off `storesVersion` state directly (rather
  // than a ref-backed lookup used to establish an immediately-live
  // subscription), a deferred write could drain in the gap between two
  // subscription instances and this bug would return silently — this
  // fix's correctness is coupled to that detail of the CONSUMER, not
  // something this hook alone can guarantee.
  //
  // LIVENESS GUARD — `alive`, not a cleanup-driven `cancelled` flag.
  // POST-REVIEW: a first draft of this deferral returned `() => {
  // cancelled = true; }` directly from THIS effect to guard the
  // vanishingly small window between scheduling the microtask and it
  // draining (e.g. a real unmount in between). That guard was ITSELF a
  // bug this fix's own draft introduced — never a defect in any shipped
  // build, since the pre-existing (pre-defer) code had no cleanup at all
  // and therefore no such failure mode. StrictMode's dev-only
  // double-invoke (mount → cleanup → mount, run synchronously, well
  // before any microtask can drain) triggered that cleanup on every
  // ordinary mount: pass 1 sets `seeded.current = true` and schedules the
  // commit; StrictMode's simulated "unmount" immediately calls the
  // cleanup, marking that schedule cancelled; pass 2 sees
  // `seeded.current` already true and schedules nothing new — so the seed
  // would never have committed, permanently, in dev. Caught before it
  // shipped by this hook's own jsdom+StrictMode test
  // (`useStructuredRows.initialEditsSeedTiming.test.ts`, the same harness
  // style `useStructuredRows.orphanPrune.test.ts` established
  // specifically to catch this class of bug).
  //
  // The real fix keeps a liveness check WITHOUT tying it to this effect's
  // own cleanup: `alive` is armed by a SEPARATE effect with no dependency
  // array, so it re-runs (cleanup then body) on every commit, including
  // both passes of StrictMode's double-invoke. A real, final unmount
  // leaves only the cleanup's `alive.current = false` with no following
  // body to re-arm it; StrictMode's simulated one is followed
  // immediately, in the same synchronous sequence, by pass 2's body
  // setting `alive.current = true` again — so by the time the microtask
  // checks it, a StrictMode remount reads `true` (seed proceeds) and a
  // genuine unmount reads `false` (seed silently skipped, matching
  // `updateResponse`'s own `if (!current) return` — which does NOT
  // itself cover this window, since a genuinely unmounted question can
  // still have a live `current` entry in `responsesAtom` if another
  // question's editor is still mounted).
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  });

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    const decision = decideInitialEditsSeed(edits, initialEdits);
    if (decision === "wait") return;
    seeded.current = true;
    if (decision === "skip" || !initialEdits) return;
    let next: EditLog<TRow> = edits;
    for (const edit of initialEdits) {
      next = applyEditToLog(next, edit, applyOpts);
    }
    queueMicrotask(() => {
      if (alive.current) commit(next);
    });
  }, [initialEdits, edits, applyOpts, commit]);

  const applyEdit = useCallback(
    (edit: RowEdit<TRow>) => {
      if (disabled) return;
      commit(applyEditToLog(edits, edit, applyOpts));
    },
    [disabled, edits, applyOpts, commit],
  );

  const resetEdits = useCallback(() => {
    if (disabled) return;
    commit([]);
    // POST-REVIEW DECISION: a Discard clears `droppedEdits` too, not just
    // `edits`. "Drop all intent; the projection collapses back to the
    // baseline" (this function's own doc comment) is a clinician-initiated
    // "forget everything I did this session" — a restore notice built on
    // `droppedEdits` naming rows lost from a PRIOR restore would be stale
    // and confusing the instant the clinician has explicitly abandoned
    // every pending edit, including whatever survived the prune. If a
    // later reason emerges to keep it (e.g. Phase 5 wants the notice to
    // outlive a Discard), that is a deliberate reopening of this decision,
    // not an oversight — it is cleared here on purpose.
    setDroppedEdits([]);
  }, [disabled, commit]);

  const isDuplicate = useCallback(
    (row: TRow) => findDuplicateCandidates(rows, duplicateKey, [row])[0],
    [rows, duplicateKey],
  );

  const addRows = useCallback(
    (candidates: readonly TRow[]): AddRowResult[] => {
      if (disabled) {
        return candidates.map(() => ({ ok: false, reason: "disabled" }));
      }
      const duplicates = findDuplicateCandidates(
        rows,
        duplicateKey,
        candidates,
      );
      const results: AddRowResult[] = [];
      let next = edits;
      for (let i = 0; i < candidates.length; i++) {
        if (duplicates[i]) {
          results.push({ ok: false, reason: "duplicate" });
          continue;
        }
        const rowId = newRowId();
        next = applyEditToLog(
          next,
          { rowId, op: "add", patch: candidates[i] },
          applyOpts,
        );
        results.push({ ok: true, rowId });
      }
      // Every candidate was a duplicate (or the batch was empty): `next`
      // is still the SAME reference as `edits` (no `applyEditToLog` call
      // ran), so skip the commit entirely — a fully-rejected batch must
      // not write to the atom or clear this question's errors.
      if (next !== edits) commit(next);
      return results;
    },
    [disabled, rows, duplicateKey, edits, applyOpts, commit],
  );

  const addRow = useCallback(
    (row: TRow): AddRowResult => addRows([row])[0],
    [addRows],
  );

  const updateRow = useCallback(
    (rowId: RowId, patch: Partial<TRow>) => {
      if (disabled) return;
      const current = rows.find((entry) => entry.rowId === rowId)?.row;
      if (!current) return;
      commit(
        applyEditToLog(
          edits,
          {
            rowId,
            op: "update",
            patch: mergePatch(current, patch, normalizePatch),
          },
          applyOpts,
        ),
      );
    },
    [disabled, rows, normalizePatch, edits, applyOpts, commit],
  );

  const removeRow = useCallback(
    (rowId: RowId) => {
      if (disabled) return;
      const entry = rows.find((row) => row.rowId === rowId);
      if (!entry) return;
      commit(
        applyEditToLog(
          edits,
          resolveRemoveIntent(entry, softDelete),
          applyOpts,
        ),
      );
    },
    [disabled, rows, softDelete, edits, applyOpts, commit],
  );

  const setRow = useCallback(
    (patch: Partial<TRow>) => {
      if (disabled) return;
      const entry = rows[0];
      const edit = resolveSetRow({
        currentRow: entry?.row,
        currentRowId: entry?.rowId,
        patch,
        createSeed,
        singletonRowId,
        normalizePatch,
        questionId,
      });
      commit(applyEditToLog(edits, edit, applyOpts));
    },
    [
      disabled,
      rows,
      createSeed,
      singletonRowId,
      normalizePatch,
      questionId,
      edits,
      applyOpts,
      commit,
    ],
  );

  const clearRow = useCallback(() => {
    if (disabled) return;
    const entry = rows[0];
    if (!entry) return;
    commit(
      applyEditToLog(edits, resolveRemoveIntent(entry, softDelete), applyOpts),
    );
  }, [disabled, rows, softDelete, edits, applyOpts, commit]);

  const base: StructuredRowsBase<TRow> = {
    edits,
    isDirty: edits.length > 0,
    orphanRowIds,
    droppedEdits,
    applyEdit,
    resetEdits,
  };

  // The runtime branch matches the `Mode` type parameter by construction
  // (callers pick `mode` and get the correspondingly-narrowed return type),
  // but nothing in the type system connects a runtime string comparison to
  // a conditional type — the cast is the one unavoidable seam between them,
  // not a domain decision.
  if (mode === "single") {
    return {
      ...base,
      row: rows[0],
      setRow,
      clearRow,
    } as unknown as StructuredRowsController<TRow, Mode>;
  }
  return {
    ...base,
    rows,
    addRow,
    addRows,
    updateRow,
    removeRow,
    isDuplicate,
  } as unknown as StructuredRowsController<TRow, Mode>;
}
