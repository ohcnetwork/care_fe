/**
 * PRODUCT DEFECT PIN, verified by execution — Phase 2 Task 10's Playwright
 * matrix (`tests/facility/patient/encounter/structuredQuestions/
 * encounterStructured.spec.ts`, "?toDischarge=true seeds a dirty,
 * discharged row on mount") found and pinned with `test.fail()`: the
 * `initialEdits` one-shot seed effect (`useStructuredRows.ts`, below the
 * orphan-prune effect) committed its write from a CHILD component's mount
 * effect, while the fill session's dirty-tracking subscription
 * (`fill/draft/useFillAutosave.ts`) is established by an ANCESTOR's own
 * mount effect. React fires child effects before parent effects on mount,
 * so the seed had already landed by the time the ancestor's subscription
 * even existed — `store.sub(...)`'s callback was never invoked for that
 * write at all, confirmed by instrumenting both effects with
 * `performance.now()` timestamps and running the actual Playwright spec
 * (the "Draft" chip never lit; Cancel navigated away with no
 * unsaved-changes prompt after a pre-seeded discharge, silently dropping a
 * real, already-timestamped edit).
 *
 * This file reproduces the SAME shape at the unit level: a PARENT
 * component establishes a subscription (baseline snapshot + `store.sub`)
 * in its OWN mount effect, wrapping a CHILD that calls
 * `useStructuredRows` with a non-empty `initialEdits` — exactly the
 * relationship `QuestionnaireFillPage` (ancestor) / the structured
 * question's editor (descendant, via `useStructuredRows`) has for real.
 * Before the fix (deferring the seed's actual `commit(...)` one
 * microtask, so it lands strictly after the CURRENT synchronous
 * effect-flush pass — which includes every ancestor effect due this pass
 * — completes), the parent's subscription callback is never invoked for
 * the seed at all. After the fix, it fires exactly once, with the seeded
 * content.
 *
 * THE ASSERTION THAT ACTUALLY PINS THIS, found missing by mutation
 * testing (post-review): checking only "a notification eventually fired"
 * is NOT sufficient — reverting the fix stayed green, because
 * `useStructuredRows.ts`'s unrelated passive `values`-mirror effect also
 * writes to the store once under StrictMode (a stale-closure
 * double-invoke artifact) and that write alone satisfies a bare
 * `notified.length > 0`. The assertion that is actually red on the
 * reverted build and green only with the fix is that the ancestor's
 * FIRST baseline snapshot — taken once, at mount, before any
 * notification — must still read the PRE-seed content (`edits: []`).
 * See the first test's own comment for the full mutation-testing story.
 *
 * No test harness for a React hook exists anywhere else in this repo
 * (`test:unit` is plain `node --test`, no jsdom/testing-library
 * dependency), so this file builds the same minimal, disposable one
 * `useStructuredRows.orphanPrune.test.ts` already established (the jsdom
 * globals below are scoped to this process only — each `node --test`
 * file runs isolated).
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
// configured to support act()".
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import {
  createStore,
  Provider as JotaiProvider,
  type WritableAtom,
} from "jotai";
import { act, createElement, StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { EditLog } from "./types";
import { useStructuredRows } from "./useStructuredRows";

interface Row {
  id: string;
  label: string;
}

const projectValues = (rows: readonly Row[]) =>
  rows.map((row) => ({ type: "string" as const, value: JSON.stringify(row) }));

/**
 * The ancestor under test: mimics `useFillSessionAutosave`'s subscription
 * effect shape exactly — captures a baseline snapshot of `responsesAtom`
 * and subscribes to it, BOTH from its OWN `useEffect`, which (being the
 * PARENT of `children`) React runs strictly AFTER every effect belonging
 * to `children`'s own subtree on mount. Records every notification
 * (content + count), not just the first, so the assertions below can tell
 * "never fired" from "fired but compared equal" apart.
 */
function DirtyTrackingAncestor({
  store,
  questionId,
  onSnapshot,
  children,
}: {
  store: ReturnType<typeof createStore>;
  questionId: string;
  onSnapshot: (event: {
    kind: "baseline" | "notified";
    edits: EditLog<Row> | undefined;
  }) => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const baseline = store.get(responsesAtom)[questionId];
    onSnapshot({
      kind: "baseline",
      edits: baseline?.edits as EditLog<Row> | undefined,
    });
    const unsub = store.sub(
      responsesAtom as unknown as WritableAtom<unknown, [unknown], unknown>,
      () => {
        const current = store.get(responsesAtom)[questionId];
        onSnapshot({
          kind: "notified",
          edits: current?.edits as EditLog<Row> | undefined,
        });
      },
    );
    return unsub;
    // Deliberately empty deps: mounts exactly once, matching a real fill
    // session's subscription effect. No eslint-disable needed —
    // `react-hooks/exhaustive-deps` is only registered for `**/*.{jsx,tsx}`
    // (`eslint.config.mjs`), not this `.ts` file.
  }, []);
  return children;
}

function mountHarness(
  questionId: string,
  seed: QuestionnaireResponse,
  initialEdits: EditLog<Row> | undefined,
) {
  const store = createStore();
  store.set(responsesAtom, { [questionId]: seed });

  const events: Array<{
    kind: "baseline" | "notified";
    edits: EditLog<Row> | undefined;
  }> = [];

  const baseline = [{ rowId: "row-1", row: { id: "row-1", label: "server" } }];

  function Child() {
    // No explicit type argument (Lesson 1 — `2026-08-04-phase2-ports-simple.md`):
    // `TRow` infers from `projectValues`/`baseline`, `Mode` from the
    // `mode: "single"` literal. The return value is intentionally unused —
    // this hook is exercised for its EFFECTS (the seed's `commit`) only.
    useStructuredRows({
      questionId,
      mode: "single",
      baseline,
      projectValues,
      initialEdits,
    });
    return null;
  }

  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root: Root = createRoot(container);

  // StrictMode, matching the app's own root (`src/index.tsx`) and the
  // orphan-prune harness — proves the fix holds under dev's
  // double-invoke-effects behavior too, not just a single clean pass.
  const render = () =>
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(
          JotaiProvider,
          { store },
          createElement(DirtyTrackingAncestor, {
            store,
            questionId,
            onSnapshot: (event) => events.push(event),
            children: createElement(Child),
          }),
        ),
      ),
    );

  return { store, events, root, container, render };
}

describe("useStructuredRows — initialEdits seed timing vs. an ancestor's dirty-tracking subscription", () => {
  const cleanups: (() => void)[] = [];
  after(() => {
    for (const cleanup of cleanups) cleanup();
  });

  it("an ancestor subscribed in ITS OWN mount effect DOES observe the seed as a live notification, not just as an already-seeded baseline", async () => {
    const questionId = "q-seed-timing";
    const seededPatch: Row = { id: "row-1", label: "DISCHARGED" };
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      // Empty log: the seed effect's own precondition
      // (`decideInitialEditsSeed`) is that this starts empty.
      edits: [],
    };

    const harness = mountHarness(questionId, seed, [
      { rowId: "row-1", op: "update", patch: seededPatch },
    ]);
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });

    await act(async () => {
      harness.render();
      // Give the deferred microtask (and any follow-up re-render it
      // triggers) real turns to resolve — the same generous-flush pattern
      // `useStructuredRows.orphanPrune.test.ts` uses, since the hook's own
      // passive effects and jotai's store-driven re-render can land on
      // different flush passes under jsdom/Node's scheduler.
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    // THE ACTUAL PIN — POST-REVIEW FIX (mutation-tested): the ancestor's
    // FIRST baseline snapshot must predate the seed, i.e. still read `[]`.
    // Without this assertion, reverting the fix (`queueMicrotask(() =>
    // commit(next))` back to a bare `commit(next)`) stayed GREEN: on the
    // reverted build BOTH baseline snapshots already carry the seeded
    // edit (the exact defect — the seed landed before the ancestor's
    // effect ever ran), and the lone "notified" event that satisfied
    // `notified.length > 0` below came from a DIFFERENT effect entirely —
    // `useStructuredRows.ts`'s passive `values`-mirror effect
    // (`:388-391`), which under StrictMode double-invokes with a stale
    // closure, overwrites `values` back to the pre-seed projection AFTER
    // the seed's synchronous commit, and the next render re-writes them
    // — a real store write, just not the one this test is named after.
    // `notified.at(-1)?.edits` still compared equal because it reads the
    // CURRENT store content at notification time, not the notification's
    // own payload, so it couldn't tell the two apart either. Checking the
    // FIRST baseline is the one assertion that is red on the reverted
    // build and green only with the fix.
    assert.deepEqual(
      harness.events.find((e) => e.kind === "baseline")?.edits,
      [],
      "the ancestor's FIRST baseline must predate the seed",
    );

    // The pin's other half: at least one "notified" event fired carrying
    // the seeded edit. Before the fix, `events` contained only ever a
    // single "baseline" entry (already showing the seeded content) and NO
    // "notified" entry, because `store.sub`'s callback was never invoked
    // for that write — proving the ancestor's dirty flag could never have
    // been set by it. Kept alongside the baseline assertion above (not in
    // place of it) since a fired notification alone is not, on its own,
    // proof it came from the seed rather than some other effect.
    const notified = harness.events.filter((e) => e.kind === "notified");
    assert.ok(
      notified.length > 0,
      `expected at least one live notification of the seed; got events: ${JSON.stringify(harness.events)}`,
    );
    assert.deepEqual(
      notified.at(-1)?.edits,
      [{ rowId: "row-1", op: "update", patch: seededPatch }],
      "the notification must carry the seeded edit itself",
    );

    // And the seed still lands exactly once in the store — the ordering
    // fix must not change WHAT gets committed, only WHEN.
    assert.deepEqual(harness.store.get(responsesAtom)[questionId].edits, [
      { rowId: "row-1", op: "update", patch: seededPatch },
    ]);
  });

  it("an undefined initialEdits (no discharge param) leaves the ancestor's baseline as the only event (no phantom notification for a no-op seed)", async () => {
    const questionId = "q-seed-timing-empty";
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [],
    };

    // `undefined` — exactly what a real editor passes when its seeding
    // condition (e.g. `?toDischarge=true`) isn't met
    // (`EncounterEditorBody`'s own `initialEdits` useMemo).
    const harness = mountHarness(questionId, seed, undefined);
    cleanups.push(() => {
      harness.root.unmount();
      harness.container.remove();
    });

    await act(async () => {
      harness.render();
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    assert.deepEqual(
      harness.events.filter((e) => e.kind === "notified"),
      [],
      "no initialEdits means nothing to seed, so the ancestor must never " +
        "see a notification for it",
    );
    assert.deepEqual(harness.store.get(responsesAtom)[questionId].edits, []);
  });

  it("an unmount that happens INSIDE the deferral window discards the seed instead of writing to a gone question — POST-REVIEW liveness guard", async () => {
    // Executed repro from review: an ancestor whose OWN mount effect calls
    // `setShow(false)` unmounts the seeding child SYNCHRONOUSLY, still
    // inside the deferral window (effect-triggered state updates flush
    // before React yields to the browser — the same mechanism that lets
    // `useFillAutosave.ts`'s subscription effect re-run within one
    // synchronous sequence when `storesVersion` bumps). Without a
    // liveness guard, the queued microtask still lands and writes `edits`
    // for a question whose editor no longer exists — which
    // `composeStructuredV2Requests` would then forward verbatim into a
    // submit. The `alive` ref (armed by its own always-rerunning effect,
    // set false only by a cleanup with no following body to re-arm it)
    // is what `updateResponse`'s own `if (!current) return` does NOT
    // cover: the question's `responsesAtom` entry is still present (some
    // OTHER question in the same form is still mounted), so `current` is
    // truthy — the guard has to be this hook's own liveness check, not a
    // side effect of the store shape.
    const questionId = "q-seed-timing-unmount";
    const seed: QuestionnaireResponse = {
      question_id: questionId,
      structured_type: "encounter",
      link_id: "q-structured",
      values: [],
      edits: [],
    };
    const store = createStore();
    store.set(responsesAtom, { [questionId]: seed });
    const baseline = [
      { rowId: "row-1", row: { id: "row-1", label: "server" } },
    ];

    function Child() {
      useStructuredRows({
        questionId,
        mode: "single",
        baseline,
        projectValues,
        initialEdits: [
          {
            rowId: "row-1",
            op: "update" as const,
            patch: { id: "row-1", label: "DISCHARGED" },
          },
        ],
      });
      return null;
    }

    function UnmountingParent() {
      const [show, setShow] = useState(true);
      useEffect(() => {
        setShow(false);
        // Deliberately empty deps: fires exactly once, on mount — the
        // "unmount the child right away" shape the repro needs.
      }, []);
      return show ? createElement(Child) : null;
    }

    const container = dom.window.document.createElement("div");
    dom.window.document.body.appendChild(container);
    const root: Root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(
            JotaiProvider,
            { store },
            createElement(UnmountingParent),
          ),
        ),
      );
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    assert.deepEqual(
      store.get(responsesAtom)[questionId].edits,
      [],
      "the seed must not land for a question whose editor unmounted " +
        "before the deferred commit could run",
    );

    root.unmount();
    container.remove();
  });
});
