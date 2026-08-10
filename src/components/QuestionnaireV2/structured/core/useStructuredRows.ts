import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useQuestionResponse,
  useSetQuestionProjection,
  useSetQuestionRowsPassively,
} from "@/components/QuestionnaireV2/form/engine/store";
import { sanitizeStructuredEditLog } from "@/types/questionnaire/structured";

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
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * React wiring over the pure structured-row core. Every decision
 * (coalescing, projection, ordering, duplicate checks, mutator dispatch,
 * the one-shot seed's latch) lives in a pure, unit-tested sibling
 * (`editLog.ts`, `projectRows.ts`, `duplicates.ts`, `rowMutations.ts`,
 * `rowIds.ts`); this file only reads/writes one question's response
 * through the form store and memoizes the pure functions' inputs/outputs.
 *
 * CAVEAT: every mutator reads `edits` from this render's closure, so two
 * mutator calls in the same event handler overwrite each other — the
 * second `commit` wins. `addRows` covers the batch-add case.
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
   * converter. The hook never fetches.
   *
   * BASELINE COMPLETENESS CONTRACT: pass either the COMPLETE fetched
   * server-row set, or `undefined` while the baseline query is loading or
   * errored — never `[]` standing in for "loading". `[]` means "the
   * server confirmed zero rows". Passing `[]` mid-fetch wrongly resolves
   * a coalesced edit's add-vs-update op (`resolveOpAgainstBaseline`) and
   * hides a restored draft's pending edit (`projectRows`' orphan rule).
   */
  baseline?: readonly BaselineRow<TRow>[];

  /** Projection → `values`. Must be referentially stable (declare it at
   *  module scope in `model.ts`); the hook memoizes on it. Empty
   *  projection MUST produce `[]`, so an emptied section reads unanswered
   *  to `entryHasContent`. */
  projectValues: ProjectValues<TRow>;

  softDelete?: SoftDeleteDescriptor<TRow>;
  duplicateKey?: (row: TRow) => string | undefined;
  displayOrder?: (a: TRow, b: TRow) => number;

  /**
   * Domain derivation applied to every patch BEFORE it is recorded.
   *
   * RETURN CONTRACT: derived fields ONLY. `mergePatch` lands them on top
   * of `{ ...row, ...patch }`, so the clinician's edit applies with or
   * without a normalizer and a returned field wins only where it is named.
   */
  normalizePatch?: (row: TRow, patch: Partial<TRow>) => Partial<TRow>;

  /** An ADDED row that satisfies this after an update replaces its patch
   *  is annihilated (appointment's clear-to-empty) — see `editLog.ts`'s
   *  `add`+`update` coalescing cell. */
  isEmptyRow?: (row: TRow) => boolean;

  /** Required by `useStructuredSingleRow` when no baseline row exists yet
   *  (a create-only singleton — `appointment`, `time_of_death`). */
  createSeed?: () => TRow;

  /**
   * Seeded ONCE, on first mount, and only when the log is empty — so a
   * restored draft always wins. This is where `encounter`'s
   * `?toDischarge=true` lives: an explicit, dirty-making user intent
   * recorded as a real edit instead of being smuggled into the baseline
   * seed.
   */
  initialEdits?: EditLog<TRow>;

  /** Submit freeze: every mutator no-ops. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

export interface StructuredRowsBase<TRow extends object> {
  /** Every edit pruned as a confirmed orphan THIS MOUNT, in the order
   *  encountered — the ONE durable channel for what the prune removed. The
   *  orphan rowIds themselves are internal: the prune excises them from
   *  `edits` the render it detects them, so nothing outside this hook could
   *  read them in time. Each entry retains its full `patch` — the only
   *  surviving copy of what the clinician typed, since the prune removes it
   *  from `edits` and an autosave carries that removal into the stored
   *  draft.
   *
   *  DURABILITY: mount-lifetime only — a remount (an `enable_when` toggle,
   *  navigating away and back) resets it. */
  droppedEdits: EditLog<TRow>;
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

/** Multi-row editing (the default shape — 8 of 11 types). */
export function useStructuredRows<TRow extends object>(
  options: StructuredRowsOptions<TRow>,
): ListRowsController<TRow> {
  const internal = useStructuredRowsInternal(options, "list");
  return {
    rows: internal.rows,
    droppedEdits: internal.droppedEdits,
    addRow: internal.addRow,
    addRows: internal.addRows,
    updateRow: internal.updateRow,
    removeRow: internal.removeRow,
  };
}

/** At-most-one-row editing (`appointment`, `time_of_death`, `encounter`).
 *  The one row is always `rows[0]`; its identity is `SINGLETON_ROW_ID`
 *  for create-only types with no server row yet, or the baseline's own
 *  key once one exists. */
export function useStructuredSingleRow<TRow extends object>(
  options: StructuredRowsOptions<TRow>,
): SingleRowController<TRow> {
  const internal = useStructuredRowsInternal(options, "single");
  return {
    row: internal.rows[0],
    droppedEdits: internal.droppedEdits,
    setRow: internal.setRow,
    clearRow: internal.clearRow,
  };
}

function useStructuredRowsInternal<TRow extends object>(
  options: StructuredRowsOptions<TRow>,
  mode: "list" | "single",
) {
  const {
    questionId,
    baseline,
    projectValues,
    softDelete,
    duplicateKey,
    displayOrder,
    normalizePatch,
    isEmptyRow,
    createSeed,
    initialEdits,
    disabled,
  } = options;

  const [response, updateResponse] = useQuestionResponse(questionId);
  // Projection-only write: the baseline-refresh effect uses this so a
  // background refetch cannot clear this question's showing errors
  // (`updateResponse` clears them on every write; only real user intent
  // should).
  const setProjection = useSetQuestionProjection(questionId);
  // Same reasoning, one step further: the orphan prune must rewrite `edits`
  // too, and is just as passive (see `commitPassively` below).
  const setRowsPassively = useSetQuestionRowsPassively(questionId);

  // Sanitized at the read boundary — the same gate the submit path's
  // reader (`composeStructured.ts`) runs `response.edits` through, so
  // display and submit always start from an identical, well-formed log.
  const edits = useMemo<EditLog<TRow>>(
    () => sanitizeStructuredEditLog(response?.edits) as EditLog<TRow>,
    [response?.edits],
  );

  // Stays `undefined` exactly when `baseline` is — see the `baseline`
  // option's completeness contract.
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
  // paints in the same commit, unlike `values` (a mirror one effect
  // behind).
  const rows = useMemo(
    () => projectRows(baseline, edits, projectOpts),
    [baseline, edits, projectOpts],
  );

  // Internal — the prune effect's trigger and nothing else. It self-clears
  // the render after the prune runs, so `droppedEdits` is the only form of
  // this a consumer can actually read.
  const orphanRowIds = useMemo(
    () => findOrphanRowIds(baseline, edits),
    [baseline, edits],
  );

  const values = useMemo(
    () => projectValues(rows.map((entry) => entry.row)),
    [rows, projectValues],
  );

  // The `{ values, edits }` pair every write lands — in a single atom
  // write, so no consumer ever sees the two disagree.
  //
  // For `mode: "single"`, the at-most-one-projected-row invariant is
  // closed by construction for every shipped type: the log's one rowId is
  // either `SINGLETON_ROW_ID` (create-only types over a constant `[]`
  // baseline) or the baseline's own key (`encounter`, which mounts only
  // after its query resolves). Asserted in dev rather than truncated, so
  // a future singleton that breaks the assumption fails loudly instead of
  // silently submitting a row the clinician never saw.
  const composeWrite = useCallback(
    (nextEdits: EditLog<TRow>) => {
      const nextRows = projectRows(baseline, nextEdits, projectOpts);
      if (import.meta.env?.DEV && mode === "single" && nextRows.length > 1) {
        console.error(
          `useStructuredRows(${questionId}): mode "single" projected ` +
            `${nextRows.length} rows — the edit log carries a rowId the ` +
            `singleton never showed`,
        );
      }
      return {
        values: projectValues(nextRows.map((entry) => entry.row)),
        edits: [...nextEdits],
      };
    },
    [baseline, projectOpts, projectValues, mode, questionId],
  );

  // The write that carries intent: it clears this question's showing
  // errors, which is correct for a mutator and for the `initialEdits` seed
  // (an explicit user intent), and wrong for anything passive — see
  // `commitPassively`.
  const commit = useCallback(
    (nextEdits: EditLog<TRow>) => updateResponse(composeWrite(nextEdits)),
    [composeWrite, updateResponse],
  );

  // The same write with no intent attached: it leaves `errorsAtom` alone.
  // Reserved for the orphan prune below — a refetch delivering a smaller
  // baseline must not make a question's server errors vanish while the
  // values that earned them stay on screen.
  const commitPassively = useCallback(
    (nextEdits: EditLog<TRow>) => setRowsPassively(composeWrite(nextEdits)),
    [composeWrite, setRowsPassively],
  );

  // Baseline moved (first load, refetch, invalidation): refresh the
  // DISPLAY mirror only; never touches `edits`. Compared structurally
  // against the response's own current `values` — not a `lastWritten`
  // ref — because (a) each `commit` is followed by a render that
  // recomputes a content-equal but new-reference `values`, so a reference
  // guard would fire one redundant write (and error-clear) per edit; and
  // (b) a ref starting `undefined` treats the very first run as
  // "changed", wiping this question's errors on every mount. Writes
  // through `setProjection`, not `updateResponse` — a passive mirror of
  // baseline movement must not clear this question's showing errors.
  useEffect(() => {
    if (deepEqualJson(response?.values, values)) return;
    setProjection(values);
  }, [response?.values, values, setProjection]);

  // Prune confirmed orphans out of `edits`, capturing them in
  // `droppedEdits` first. A rowId the complete, known baseline no longer
  // has must never sit in `response.edits` — that log is forwarded
  // verbatim to a type's `toRequests`, which never receives a baseline.
  // This hook is the one place `baseline` and `edits` coexist, so pruning
  // happens here, reactively: the realistic failure is passive — a
  // restored draft targets a row that vanished server-side and the
  // clinician never touches the section again before submit. Guarded on
  // `orphanRowIds` (empty while `baseline` is `undefined` — loading is
  // not confirmed-gone), it converges in one pass.
  //
  // Each dropped edit is appended to `droppedEdits` BEFORE the commit
  // removes it from `edits`: otherwise the prune destroys the only record
  // of what it removed before any restore-notice UI could read it.
  //
  // Deliberately NOT gated on `disabled`: the submit freeze blocks NEW
  // user intent, but this effect records none — it only excises intent
  // the baseline has proven stale. For the same reason it writes through
  // `commitPassively`: recording no intent, it must not clear the
  // question's showing errors.
  //
  // StrictMode double-invokes effects, so the functional `setDroppedEdits`
  // updater is idempotent: it skips already-captured rowIds and returns
  // `previous` itself when nothing new survives — no state write, no
  // re-render on the second invocation.
  const [droppedEdits, setDroppedEdits] = useState<EditLog<TRow>>([]);
  useEffect(() => {
    // NOT an optimization — this early return prevents an unbounded
    // render loop under an unmemoized `baseline`. The commit always writes
    // the atom, and an unmemoized baseline gives `orphanRowIds` a fresh
    // array reference every render even while its content stays `[]` —
    // without this guard that alone would commit, re-render, and commit
    // again, forever. Pinned by a write-count test in
    // `useStructuredRows.orphanPrune.test.ts`.
    if (orphanRowIds.length === 0) return;
    const orphanSet = new Set(orphanRowIds);
    setDroppedEdits((previous) => {
      const alreadyDropped = new Set(previous.map((edit) => edit.rowId));
      const additions = edits.filter(
        (edit) => orphanSet.has(edit.rowId) && !alreadyDropped.has(edit.rowId),
      );
      return additions.length === 0 ? previous : [...previous, ...additions];
    });
    commitPassively(pruneOrphanEdits(baseline, edits));
  }, [orphanRowIds, baseline, edits, commitPassively]);

  // Declarative one-shot seed (e.g. encounter's `?toDischarge`). The latch
  // decision is `decideInitialEditsSeed`: the ref must NOT latch while
  // `initialEdits` simply hasn't arrived yet ("wait"), only once the log
  // has content ("skip") or `initialEdits` does ("seed") — otherwise a
  // seed built from baseline data that resolves after mount is dropped
  // forever.
  //
  // THE WRITE IS DEFERRED ONE MICROTASK. React runs child effects before
  // parent effects on mount, and this hook always sits below the fill
  // session's dirty-tracking subscription (`useFillAutosave`) — a
  // synchronous commit here lands before that subscription exists, so the
  // seed would never mark the form dirty (no Draft chip, no
  // unsaved-changes warning, a silently lost edit). `queueMicrotask` runs
  // strictly after the whole synchronous effect-flush pass and drains
  // before the next paint, so the seeded row still shows from the first
  // frame. `seeded.current` still flips synchronously, so the one-shot
  // latch and its StrictMode safety are unaffected.
  //
  // LIVENESS GUARD — `alive`, not a cleanup-driven `cancelled` flag. A
  // cleanup returned from the seed effect breaks under StrictMode's
  // synchronous mount→cleanup→mount: pass 1 schedules the commit, the
  // simulated unmount cancels it, pass 2 sees `seeded.current` already
  // true and schedules nothing — the seed never commits in dev. Instead
  // `alive` is armed by a separate dep-less effect: a StrictMode remount
  // re-arms it before the microtask drains; a real unmount leaves it
  // false.
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
      // A fully-rejected (or empty) batch leaves `next === edits` — skip
      // the commit so it does not write the atom or clear this question's
      // errors.
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
        singletonRowId: SINGLETON_ROW_ID,
        normalizePatch,
        questionId,
      });
      commit(applyEditToLog(edits, edit, applyOpts));
    },
    [
      disabled,
      rows,
      createSeed,
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

  return {
    rows,
    droppedEdits,
    addRow,
    addRows,
    updateRow,
    removeRow,
    setRow,
    clearRow,
  };
}
