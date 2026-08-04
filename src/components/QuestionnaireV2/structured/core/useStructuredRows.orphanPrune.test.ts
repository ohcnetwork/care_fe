/**
 * PHASE 2 CARRY-FORWARD FIX — wiring pin, per code review.
 *
 * Every other test in this directory targets a pure sibling; this file is
 * the deliberate exception, because the thing under test IS the wiring:
 * `useStructuredRows`'s passive prune effect is what actually keeps a
 * confirmed-orphan edit out of `response.edits` (the only thing
 * `composeStructuredV2Requests` reads) and out of what `commit` persists to
 * a draft. `pruneOrphanEdits` (`projectRows.test.ts`) proves the FILTER is
 * correct; nothing proved the EFFECT is actually wired to it — delete the
 * effect entirely and every other `test:unit` case stays green. This file
 * is that missing pin.
 *
 * No test harness for a React hook exists anywhere else in this repo
 * (`test:unit` is plain `node --test`, no jsdom/testing-library
 * dependency), so this file builds a minimal, disposable one from
 * packages already in `package.json` (`jsdom`, `react-dom/client`,
 * `jotai`'s `createStore`) rather than adding a repo-wide dependency for
 * one file. The jsdom globals below are scoped to this process only.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

// `Object.assign` throws on `globalThis.navigator` under Node >= 21 — Node
// defines its own experimental `navigator` as a getter-only accessor
// property, which a plain assignment can't overwrite. `defineProperty`
// replaces the descriptor outright instead of going through `[[Set]]`.
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  requestAnimationFrame: (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number,
  cancelAnimationFrame: (id: number) => clearTimeout(id),
})) {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

// Tells React's `act()` it's allowed to flush effects/renders synchronously
// instead of warning that "the current testing environment is not
// configured to support act()" — the flag `react`/`react-dom` check for,
// not something jsdom or `act` itself infers automatically.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { createStore, Provider as JotaiProvider } from "jotai";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

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

  // POST-REVIEW: wrapped in `StrictMode` — the app itself renders under it
  // (`src/index.tsx`), which double-invokes effects in dev to catch
  // exactly this class of bug (a non-idempotent effect body). The first
  // version of this harness did NOT use `StrictMode` and could not have
  // caught the `droppedEdits` double-count the review found — this rig
  // would have reported green either way, which is the point of adding it
  // here rather than trusting the earlier, StrictMode-blind version.
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
 * no-ops) a few real macrotask turns to finish. A single synchronous
 * `act(() => {...})` was not enough in practice — this hook's two passive
 * effects and jotai's store-driven re-render can land on different
 * flush passes under jsdom/Node's scheduler — so this loops a fixed,
 * generous number of macrotask turns inside one `act(async () => ...)`
 * rather than assuming a single pass converges.
 */
async function setBaselineAndFlush(
  harness: Pick<ReturnType<typeof mountHarness>, "baselineRef" | "render">,
  baseline: readonly BaselineRow<Row>[] | undefined,
) {
  harness.baselineRef.current = baseline;
  await act(async () => {
    harness.render();
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

describe("useStructuredRows — PHASE 2 CARRY-FORWARD FIX wiring: confirmed orphans are pruned from response.edits and captured in droppedEdits", () => {
  const cleanups: (() => void)[] = [];
  after(() => {
    for (const cleanup of cleanups) cleanup();
  });

  it("a restored draft's edit for a rowId the (now-known) baseline lacks is removed from response.edits, is never re-shown by orphanRowIds after the prune, and survives in droppedEdits", async () => {
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
    assert.deepEqual(resultRef.current?.orphanRowIds, []);
    assert.deepEqual(resultRef.current?.droppedEdits, []);

    // 2. Baseline resolves — a known, empty array: the server confirms
    //    "vanished" does not exist. This is the exact carry-forward
    //    scenario: no mutator runs, only baseline moving.
    await setBaselineAndFlush(harness, []);

    assert.deepEqual(
      store.get(responsesAtom)[questionId].edits,
      [],
      "the confirmed orphan must be gone from response.edits — the only " +
        "thing composeStructuredV2Requests/structuredEditsOf ever reads",
    );
    assert.deepEqual(
      resultRef.current?.orphanRowIds,
      [],
      "orphanRowIds self-clears once the prune has run (documented trade-off)",
    );
    assert.deepEqual(
      resultRef.current?.droppedEdits,
      [staleEdit],
      "droppedEdits is the durable record A1's restore notice needs — " +
        "orphanRowIds alone cannot survive to be read later",
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

  it("resetEdits (Discard) also clears droppedEdits, not just edits — POST-REVIEW decision", async () => {
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
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
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
      // reset immediately below excludes ONLY this one seed write and
      // nothing an effect does afterward (resetting the counter only
      // AFTER a combined write+flush block would also discard whatever
      // the effect itself wrote during that same flush — the mistake an
      // earlier draft of this test made, which is why it passed even with
      // the guard removed).
      store.set(responsesAtom, {
        ...store.get(responsesAtom),
        [questionId]: { ...current, edits: [...(current.edits ?? [])] },
      });
      writeCount = 0;
      await act(async () => {
        for (let j = 0; j < 5; j++) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
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
