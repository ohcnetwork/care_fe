import { useCallback, useEffect, useMemo, useRef } from "react";

import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import { deepEqualJson } from "./deepEqual";
import { findDuplicateCandidates } from "./duplicates";
import {
  applyEditToLog,
  toBaselineMap,
  type ApplyEditOptions,
} from "./editLog";
import { findOrphanRowIds, projectRows, pruneOrphanEdits } from "./projectRows";
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
 *  1. **No new `form/engine/store.ts` export.** The annex's §10 body adds a
 *     `useSetQuestionProjection` atom (a projection-only write that
 *     deliberately skips `clearQuestionErrorsInState`, so a background
 *     baseline refetch cannot wipe a submit-time error). This task's
 *     territory is `structured/core/*` only; `form/engine/store.ts` is out
 *     of bounds. Both this hook's writes therefore go through the existing
 *     `useQuestionResponse` setter, which DOES clear the question's errors
 *     on every write — including the passive baseline-driven refresh
 *     effect below. Documented here as a known, deliberate deviation
 *     (recorded by review as a plan carry-forward, not this task's to
 *     close): a refetch arriving while a submit error is showing will
 *     clear it. Every real type's baseline query is expected to have
 *     settled long before a submit error could exist, so the window this
 *     affects is narrow — but a future task revisiting
 *     `form/engine/store.ts` should reintroduce the annex's split write if
 *     this proves to matter in practice.
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
 *  4. **A passive effect prunes confirmed orphans out of `edits`** (Phase 2
 *     carry-forward fix, see that effect's own doc comment below for the
 *     full argument): once `baseline` is a known array and `orphanRowIds`
 *     is non-empty, `commit(pruneOrphanEdits(baseline, edits))` runs
 *     unconditionally — no annex equivalent, since the annex predates
 *     `findOrphanRowIds` entirely.
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
   *  amendment A1) — a later restore-notice UI names these; this hook only
   *  exposes the channel. Computed by `projectRows.ts`'s
   *  `findOrphanRowIds`, over the same `(baseline, edits)` `rows` is. */
  orphanRowIds: readonly RowId[];
  /** The raw seam — the assistant's `applyStructuredEdit` path (a later
   *  phase) and any caller needing to record an edit `useStructuredRows`
   *  doesn't otherwise expose a mutator for. */
  applyEdit: (edit: RowEdit<TRow>) => void;
  /** Drop all intent; the projection collapses back to the baseline. */
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

  const edits = useMemo<EditLog<TRow>>(
    () => (response?.edits ?? []) as EditLog<TRow>,
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
  const commit = useCallback(
    (nextEdits: EditLog<TRow>) => {
      const nextRows = projectRows(baseline, nextEdits, projectOpts);
      const nextValues = projectValues(nextRows.map((entry) => entry.row));
      updateResponse({
        values: nextValues,
        edits: nextEdits as unknown as StructuredEditRecord[],
      });
    },
    [baseline, projectOpts, projectValues, updateResponse],
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
  // comment, item 2, for the two review findings this fixes.
  useEffect(() => {
    if (deepEqualJson(response?.values, values)) return;
    updateResponse({ values });
  }, [response?.values, values, updateResponse]);

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
  // KNOWN TRADE-OFF for spec amendment A1's restore notice (carry-forward
  // item 2, owner Phase 5): `orphanRowIds` still fires true for one render
  // at the moment an orphan is detected (this effect runs after paint,
  // per React's effect timing), but this prune then clears it. A
  // persistent "N restored edits could not be applied" banner cannot just
  // read `orphanRowIds` continuously — Phase 5 needs to capture the
  // rowIds at the moment they appear (e.g. into its own state) rather
  // than assume this array stays non-empty. The channel itself is not
  // regressed — it still accurately reflects `(baseline, edits)` on every
  // render — it is just no longer a durable record once this effect has
  // had a chance to run.
  //
  // Deliberately NOT gated on `disabled` (unlike every mutator below):
  // `disabled` (P1-4's submit freeze) exists to block NEW user intent from
  // being recorded mid-submit, but this effect records none — it only
  // excises intent the baseline has already proven stale. Gating it would
  // only reopen the exact race this fix closes (freeze engages the instant
  // baseline resolves, the prune never runs, the orphan reaches submit
  // anyway); in the ordinary timeline baseline resolves long before a
  // clinician reaches Save, so this has already run by then regardless.
  useEffect(() => {
    if (orphanRowIds.length === 0) return;
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
    commit(next);
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
