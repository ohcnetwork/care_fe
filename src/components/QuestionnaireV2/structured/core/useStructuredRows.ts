import { useCallback, useEffect, useMemo, useRef } from "react";

import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";
import type { ResponseValue } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import { deepEqualJson } from "./deepEqual";
import { findDuplicateCandidates } from "./duplicates";
import { applyEditToLog, type ApplyEditOptions } from "./editLog";
import { findOrphanRowIds, projectRows } from "./projectRows";
import { newRowId, SINGLETON_ROW_ID } from "./rowIds";
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
 * canonicalize, project, order, resolve, duplicate-check) is delegated to a
 * pure, `node:test`-covered sibling (`editLog.ts`, `projectRows.ts`,
 * `duplicates.ts`, `rowIds.ts`). What remains here is wiring: reading and
 * writing one question's response through the form store, memoizing the
 * pure functions' inputs/outputs, and picking which of the two controller
 * shapes (`list/single`) to return. The guard clauses below (`if (disabled)
 * return`, the seed/refresh effects' one-shot checks) are precondition
 * checks, not domain decisions — the annex's own §10 reference
 * implementation has the identical shape of clauses and is the one this
 * file translates from.
 *
 * Design source: `docs/superpowers/specs/annexes/p1-state-core.md` §10
 * (hook API + reference body), §13 (list type worked example), §14
 * (singleton), §15 (create-only singleton) — translated per the plan's
 * CANONICAL EDIT VOCABULARY table (`rowId` not `row_id`, `patch: TRow`
 * always the complete row, no `StructuredRowEdit`/`edits.ts`). Three
 * deliberate departures from the annex's draft, beyond vocabulary:
 *
 *  1. **No new `form/engine/store.ts` export.** The annex's §10 body adds a
 *     `useSetQuestionProjection` atom (a projection-only write that
 *     deliberately skips `clearQuestionErrorsInState`, so a background
 *     baseline refetch cannot wipe a submit-time error). This task's
 *     territory is `structured/core/*` only; `form/engine/store.ts` is out
 *     of bounds. Both this hook's writes therefore go through the existing
 *     `useQuestionResponse` setter, which DOES clear the question's errors
 *     on every write — including the passive baseline-driven refresh
 *     effect below. Documented here as a known, deliberate deviation: a
 *     refetch arriving while a submit error is showing will clear it. No
 *     obligation in task-7-brief.md calls this out, and every real type's
 *     baseline query is expected to have settled long before a submit
 *     error could exist, so the window this affects is narrow — but a
 *     future task revisiting `form/engine/store.ts` should reintroduce the
 *     annex's split write if this proves to matter in practice.
 *  2. **The passive refresh effect below compares `values` structurally
 *     (`deepEqualJson`), not just by reference**, per the annex's own
 *     "Risk — projection write loop" note (§18): a `commit` already writes
 *     `values` once; the following render recomputes an equal-content but
 *     new-reference `values` array, and a reference-only guard would fire
 *     one redundant extra atom write (and error-clear) per edit. The
 *     structural comparison absorbs that instead.
 *  3. **Orphan rowIds are exposed** (`StructuredRowsBase.orphanRowIds`),
 *     computed by `projectRows.ts`'s `findOrphanRowIds` — spec amendment
 *     A1 / task-7-brief.md obligation 2. The annex predates this
 *     obligation and has no equivalent field.
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
  // when `baseline` itself is — never coerced to an empty `Map`, which
  // `editLog.ts`'s `resolveOpAgainstBaseline` would read as "this rowId is
  // provably not on the server" instead of "not yet known". See the
  // `baseline` option's own doc comment above.
  const baselineMap = useMemo<ReadonlyMap<RowId, TRow> | undefined>(
    () =>
      baseline === undefined
        ? undefined
        : new Map(baseline.map((entry) => [entry.rowId, entry.row] as const)),
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
  const lastWritten = useRef<ResponseValue[] | undefined>(undefined);
  const commit = useCallback(
    (nextEdits: EditLog<TRow>) => {
      const nextRows = projectRows(baseline, nextEdits, projectOpts);
      const nextValues = projectValues(nextRows.map((entry) => entry.row));
      lastWritten.current = nextValues;
      updateResponse({
        values: nextValues,
        edits: nextEdits as unknown as StructuredEditRecord[],
      });
    },
    [baseline, projectOpts, projectValues, updateResponse],
  );

  // Baseline moved (first load, refetch, invalidation): refresh the
  // DISPLAY mirror only. Never touches `edits`. Structural (not reference)
  // comparison against `lastWritten` — see this file's doc comment, item 2
  // — so the redundant re-render `commit` otherwise causes (it computes its
  // own fresh `nextValues`, distinct by reference from what this effect
  // recomputes from the resulting `rows` on the next render) settles
  // without a second, content-identical atom write.
  useEffect(() => {
    if (
      lastWritten.current !== undefined &&
      deepEqualJson(lastWritten.current, values)
    ) {
      lastWritten.current = values;
      return;
    }
    lastWritten.current = values;
    updateResponse({ values });
  }, [values, updateResponse]);

  // Declarative one-shot seed (e.g. encounter's `?toDischarge`). A restored
  // draft wins: only applied when the log is still empty.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (!initialEdits?.length || edits.length > 0) return;
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
      commit(next);
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
      const derived = normalizePatch?.(current, patch) ?? patch;
      const merged = { ...current, ...derived } as TRow;
      commit(
        applyEditToLog(
          edits,
          { rowId, op: "update", patch: merged },
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
      if (entry.origin === "baseline" && softDelete) {
        // Server row + marker semantics ⇒ an ordinary update carrying the
        // marker merged onto the row's current content — the row stays on
        // screen, softDeleted, and un-removing later is just another
        // update. See `SoftDeleteDescriptor`'s doc comment (`./types`).
        const merged = { ...entry.row, ...softDelete.patch } as TRow;
        commit(
          applyEditToLog(
            edits,
            { rowId, op: "update", patch: merged },
            applyOpts,
          ),
        );
        return;
      }
      // Either an added row (annihilated by the reducer — it never reached
      // the server) or a baseline row of a type with true delete
      // semantics. `patch` carries the row's last-known content, per the
      // canonical vocabulary's `remove` contract.
      commit(
        applyEditToLog(
          edits,
          { rowId, op: "remove", patch: entry.row },
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
      if (entry) {
        // Baseline row present, or an `add` already recorded — either way
        // an ordinary update; `editLog.ts`'s coalescing keeps it an `add`
        // if that's what the existing entry already is.
        const derived = normalizePatch?.(entry.row, patch) ?? patch;
        const merged = { ...entry.row, ...derived } as TRow;
        commit(
          applyEditToLog(
            edits,
            { rowId: entry.rowId, op: "update", patch: merged },
            applyOpts,
          ),
        );
        return;
      }
      // No row yet at all: the first-ever creation of a create-only
      // singleton. `createSeed` is a required precondition for this path —
      // enforced here, not extracted, since it is a caller-configuration
      // invariant, not a domain decision over row content.
      if (!createSeed) {
        throw new Error(
          `useStructuredRows(${questionId}): mode:"single" with no baseline row requires createSeed`,
        );
      }
      const seed = createSeed();
      const derived = normalizePatch?.(seed, patch) ?? patch;
      const merged = { ...seed, ...derived } as TRow;
      commit(
        applyEditToLog(
          edits,
          { rowId: singletonRowId, op: "add", patch: merged },
          applyOpts,
        ),
      );
    },
    [
      disabled,
      rows,
      normalizePatch,
      createSeed,
      singletonRowId,
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
      applyEditToLog(
        edits,
        { rowId: entry.rowId, op: "remove", patch: entry.row },
        applyOpts,
      ),
    );
  }, [disabled, rows, edits, applyOpts, commit]);

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
