/**
 * Wiring pin for `useStructuredRows`'s passive orphan-prune effect.
 *
 * Every other test in this directory targets a pure sibling; this file is
 * the deliberate exception, because the thing under test IS the wiring:
 * the passive prune effect is what actually keeps a confirmed-orphan edit
 * out of `response.edits` (the only thing `composeStructuredV2Requests`
 * reads) and out of what `commit` persists to a draft. `pruneOrphanEdits`
 * (`projectRows.test.ts`) proves the FILTER is correct; delete the effect
 * entirely and every other `test:unit` case stays green. This file is
 * that missing pin.
 *
 * The jsdom bootstrap lives in `jsdomTestEnv.ts`, shared with
 * `useStructuredRows.initialEditsSeedTiming.test.ts` — the side-effect
 * import below must stay the FIRST import, before anything that
 * transitively loads `react-dom`.
 */
import "./jsdomTestEnv";

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { createStore, Provider as JotaiProvider } from "jotai";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  errorsAtom,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import { dom, flushTurns } from "./jsdomTestEnv";
import type { BaselineRow, ProjectValues } from "./types";
import {
  useStructuredRows,
  type ListRowsController,
} from "./useStructuredRows";

interface Row {
  id: string;
  label: string;
}

const projectValues: ProjectValues<Row> = (rows) =>
  rows.map((row) => ({ type: "string", value: JSON.stringify(row) }));

/**
 * Renders `useStructuredRows` inside a fresh, isolated Jotai store (via
 * `createStore` + `<Provider store={store}>`, mirroring `form/
 * FormContext.tsx`'s real per-form scope — `useQuestionResponse` resolves
 * its atoms against whichever store the nearest `<Provider>` supplies, NOT
 * a global default, so the Provider wrapping below is load-bearing, not
 * decoration: omitting it silently strands the hook on jotai's own
 * separate default store, where every read/write is invisible to this
 * harness's `store.get(responsesAtom)` assertions).
 *
 * Returns a single, stable `Harness` component (not redefined per render)
 * plus refs the test mutates directly (`baselineRef`) and reads after each
 * flush (`resultRef`) — the hook's own return value for the most recent
 * render.
 */
function mountHarness(questionId: string, seed: QuestionnaireResponse) {
  const store = createStore();
  store.set(responsesAtom, { [questionId]: seed });

  const resultRef: { current: ListRowsController<Row> | undefined } = {
    current: undefined,
  };
  const baselineRef: { current: readonly BaselineRow<Row>[] | undefined } = {
    current: undefined,
  };

  function Harness() {
    resultRef.current = useStructuredRows<Row>({
      questionId,
      baseline: baselineRef.current,
      projectValues,
    });
    return null;
  }

  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root: Root = createRoot(container);

  // StrictMode, matching the app's own root (`src/index.tsx`): dev's
  // double-invoke-effects behavior is what catches a non-idempotent
  // effect body (e.g. a `droppedEdits` double-append) — a
  // non-StrictMode harness reports green either way.
  const render = () =>
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(JotaiProvider, { store }, createElement(Harness)),
      ),
    );

  return { store, resultRef, baselineRef, root, container, render };
}

/**
 * Sets the baseline the next render will see, renders, then gives the
 * passive-effect cascade (render → `values`-mirror effect → the prune
 * effect → `commit` → atom write → re-render → both effects settling to
 * no-ops) a generous number of macrotask turns to finish.
 */
async function setBaselineAndFlush(
  harness: Pick<ReturnType<typeof mountHarness>, "baselineRef" | "render">,
  baseline: readonly BaselineRow<Row>[] | undefined,
) {
  harness.baselineRef.current = baseline;
  await act(async () => {
    harness.render();
    await flushTurns(10);
  });
}

describe("useStructuredRows — confirmed orphans are pruned from response.edits and captured in droppedEdits", () => {
  const cleanups: (() => void)[] = [];
  after(() => {
    for (const cleanup of cleanups) cleanup();
  });

  it("a restored draft's edit for a rowId the (now-known) baseline lacks is removed from response.edits and survives in droppedEdits", async () => {
    const questionId = "q-orphan-pin";
    const staleEdit: StructuredEditRecord = {
      rowId: "vanished",
      op: "update",
      patch: { id: "vanished", label: "restored draft intent" },
    };
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [staleEdit],
    };

    const harness = mountHarness(questionId, seed);
    const { store, resultRef } = harness;
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });

    // 1. Mount with baseline UNDEFINED (loading window) — the stale edit
    //    must survive untouched: unresolved is not confirmed-gone.
    await setBaselineAndFlush(harness, undefined);
    assert.deepEqual(
      store.get(responsesAtom)[questionId].edits,
      [staleEdit],
      "baseline undefined must never prune",
    );
    assert.deepEqual(resultRef.current?.droppedEdits, []);

    // 2. Baseline resolves — a known, empty array: the server confirms
    //    "vanished" does not exist. This is the exact scenario under test:
    //    no mutator runs, only baseline moving.
    await setBaselineAndFlush(harness, []);

    assert.deepEqual(
      store.get(responsesAtom)[questionId].edits,
      [],
      "the confirmed orphan must be gone from response.edits — the only " +
        "thing composeStructuredV2Requests/structuredEditsOf ever reads",
    );
    assert.deepEqual(
      resultRef.current?.droppedEdits,
      [staleEdit],
      "droppedEdits is the durable record a restore notice needs — the " +
        "orphan rowIds self-clear the render the prune runs, so nothing " +
        "outside the hook could read them in time",
    );

    // 3. Idempotent: re-rendering again with the same (still-empty)
    //    baseline must not keep re-appending to droppedEdits.
    await setBaselineAndFlush(harness, []);
    assert.deepEqual(resultRef.current?.droppedEdits, [staleEdit]);
  });

  it("droppedEdits does NOT include a live edit, an add, or the clinician's own remove of a row the baseline still has", async () => {
    const questionId = "q-orphan-pin-2";
    const liveEdit: StructuredEditRecord = {
      rowId: "survives",
      op: "update",
      patch: { id: "survives", label: "still here" },
    };
    const ownRemove: StructuredEditRecord = {
      rowId: "present",
      op: "remove",
      patch: { id: "present", label: "clinician removed this" },
    };
    const staleEdit: StructuredEditRecord = {
      rowId: "gone-server-side",
      op: "update",
      patch: { id: "gone-server-side", label: "stale" },
    };
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [liveEdit, ownRemove, staleEdit],
    };

    const harness = mountHarness(questionId, seed);
    const { store, resultRef } = harness;
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });

    const baseline: readonly BaselineRow<Row>[] = [
      { rowId: "survives", row: { id: "survives", label: "server value" } },
      { rowId: "present", row: { id: "present", label: "server value" } },
    ];
    await setBaselineAndFlush(harness, baseline);

    assert.deepEqual(resultRef.current?.droppedEdits, [staleEdit]);
    assert.deepEqual(store.get(responsesAtom)[questionId].edits, [
      liveEdit,
      ownRemove,
    ]);
  });

  it("the prune leaves this question's SHOWING errors intact — only genuine intent clears them", async () => {
    const questionId = "q-orphan-pin-errors";
    const staleEdit: StructuredEditRecord = {
      rowId: "vanished",
      op: "update",
      patch: { id: "vanished", label: "restored draft intent" },
    };
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [staleEdit],
    };
    // A mapped server error from a failed submit, still on screen against
    // a row the refetched baseline still has.
    const showing: QuestionValidationError = {
      question_id: questionId,
      row_id: "survives",
      field_key: "label",
      error: "server said no",
    };

    const harness = mountHarness(questionId, seed);
    const { store, resultRef } = harness;
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });
    store.set(errorsAtom, [showing]);

    await setBaselineAndFlush(harness, undefined);
    // A smaller baseline arrives: "vanished" is confirmed gone, "survives"
    // — the row the error is bound to — is not.
    await setBaselineAndFlush(harness, [
      { rowId: "survives", row: { id: "survives", label: "server value" } },
    ]);

    assert.deepEqual(
      store.get(responsesAtom)[questionId].edits,
      [],
      "sanity: the prune actually ran",
    );
    assert.deepEqual(
      store.get(errorsAtom),
      [showing],
      "a passive prune records no intent, so the error that flagged a " +
        "still-showing value must survive it",
    );

    // Contrast: a real mutator IS intent, and does clear them.
    await act(async () => {
      resultRef.current?.addRow({ id: "new", label: "typed" });
      await flushTurns(10);
    });
    assert.deepEqual(store.get(errorsAtom), []);
  });

  it("resetEdits (Discard) also clears droppedEdits, not just edits", async () => {
    const questionId = "q-orphan-pin-reset";
    const staleEdit: StructuredEditRecord = {
      rowId: "vanished",
      op: "update",
      patch: { id: "vanished", label: "restored draft intent" },
    };
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [staleEdit],
    };

    const harness = mountHarness(questionId, seed);
    const { resultRef } = harness;
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });

    await setBaselineAndFlush(harness, undefined);
    await setBaselineAndFlush(harness, []); // reveals the orphan, prunes it
    assert.deepEqual(
      resultRef.current?.droppedEdits,
      [staleEdit],
      "sanity: the orphan was actually captured before Discard",
    );

    await act(async () => {
      resultRef.current?.resetEdits();
      await flushTurns(10);
    });

    assert.deepEqual(
      resultRef.current?.droppedEdits,
      [],
      "a Discard forgets the restore-notice record too, per resetEdits's " +
        "own doc comment — a stale notice naming edits from before an " +
        "explicit 'forget everything' action would confuse, not inform",
    );
    assert.deepEqual(resultRef.current?.edits, []);
  });

  it("the length===0 guard's second job: no write happens while baseline stays undefined, even when edits's reference churns (an unmemoized-baseline-shaped stress, without risking an actual unbounded loop)", async () => {
    const questionId = "q-orphan-pin-guard";
    const staleEdit: StructuredEditRecord = {
      rowId: "vanished",
      op: "update",
      patch: { id: "vanished", label: "restored draft intent" },
    };
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [staleEdit],
    };

    const harness = mountHarness(questionId, seed);
    const { store } = harness;
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });

    await setBaselineAndFlush(harness, undefined);

    let writeCount = 0;
    const unsub = store.sub(responsesAtom, () => {
      writeCount++;
    });

    for (let i = 0; i < 3; i++) {
      // Force `orphanRowIds`'s `useMemo` to recompute to a FRESH (but
      // still content-`[]`, since baseline is still undefined) array
      // reference, by giving `edits` a new top-level array identity with
      // the SAME element — simulating what an unmemoized `baseline` would
      // do to `orphanRowIds`'s identity on every render, without actually
      // letting `baseline` itself vary (which is what would risk a real
      // unbounded render loop). This is what makes the assertion below
      // NON-vacuous with respect to the guard: `findOrphanRowIds(undefined,
      // …)` trivially returning `[]` is true whether or not the guard
      // exists, but a guard-less effect would still fire — and still
      // `commit` — on every one of these reference changes.
      const current = store.get(responsesAtom)[questionId];
      // The manual write itself, OUTSIDE any flush loop, so the counter
      // reset immediately below excludes ONLY this one seed write:
      // resetting only AFTER a combined write+flush block would also
      // discard whatever the effect itself wrote during that flush,
      // making the zero-write assertion vacuous.
      store.set(responsesAtom, {
        ...store.get(responsesAtom),
        [questionId]: { ...current, edits: [...(current.edits ?? [])] },
      });
      writeCount = 0;
      await act(async () => {
        await flushTurns(5);
      });
      assert.equal(
        writeCount,
        0,
        `iteration ${i}: baseline is still undefined — no commit should ` +
          "follow from edits's reference alone changing",
      );
    }

    unsub();
  });
});
