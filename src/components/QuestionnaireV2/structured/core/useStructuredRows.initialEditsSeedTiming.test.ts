/**
 * Pins the initialEdits seed's timing against an ancestor's
 * dirty-tracking subscription. React fires child effects before parent
 * effects on mount, and `useStructuredRows` always sits below the fill
 * session's subscription (`fill/draft/useFillAutosave.ts`, mounted by
 * `QuestionnaireFillPage`), so a seed committed synchronously from this
 * hook's mount effect lands before the subscription exists — the write is
 * never observed, the Draft chip never lights, and Cancel navigates away
 * without an unsaved-changes prompt. The fix under test defers the seed's
 * commit one microtask so it lands strictly after the whole synchronous
 * effect-flush pass.
 *
 * The harness reproduces the same shape: a PARENT establishes a baseline
 * snapshot + `store.sub` in its OWN mount effect, wrapping a CHILD that
 * calls `useStructuredRows` with non-empty `initialEdits`.
 *
 * THE LOAD-BEARING ASSERTION: the ancestor's FIRST baseline snapshot must
 * still read the pre-seed content (`edits: []`). A bare
 * `notified.length > 0` does not discriminate — without the deferral both
 * baseline snapshots already carry the seed, and the hook's unrelated
 * passive values-mirror effect still produces one store write under
 * StrictMode that satisfies it.
 *
 * The jsdom bootstrap is shared with `useStructuredRows.orphanPrune.test.ts`
 * via `jsdomTestEnv.ts` — the side-effect import below must stay the FIRST
 * import, before anything that transitively loads `react-dom`.
 */
import "./jsdomTestEnv";

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { createStore, Provider as JotaiProvider } from "jotai";
import { act, createElement, StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import { dom, flushTurns } from "./jsdomTestEnv";
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
    const unsub = store.sub(responsesAtom, () => {
      const current = store.get(responsesAtom)[questionId];
      onSnapshot({
        kind: "notified",
        edits: current?.edits as EditLog<Row> | undefined,
      });
    });
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
    // No explicit type argument: `TRow` infers from `projectValues`/
    // `baseline`, `Mode` from the `mode: "single"` literal. The return
    // value is intentionally unused — this hook is exercised for its
    // EFFECTS (the seed's `commit`) only.
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
      // triggers) real turns to resolve.
      await flushTurns(10);
    });

    // THE LOAD-BEARING ASSERTION: the ancestor's FIRST baseline snapshot
    // must predate the seed, i.e. still read `[]`. The other assertions
    // below do not discriminate on their own: without the deferral, both
    // baseline snapshots already carry the seeded edit, and the hook's
    // passive values-mirror effect still produces one store write under
    // StrictMode that satisfies `notified.length > 0`; `notified.at(-1)`
    // reads CURRENT store content at notification time, so it compares
    // equal either way.
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
      await flushTurns(10);
    });

    assert.deepEqual(
      harness.events.filter((e) => e.kind === "notified"),
      [],
      "no initialEdits means nothing to seed, so the ancestor must never " +
        "see a notification for it",
    );
    assert.deepEqual(harness.store.get(responsesAtom)[questionId].edits, []);
  });

  it("an unmount that happens INSIDE the deferral window discards the seed instead of writing to a gone question", async () => {
    // An ancestor whose OWN mount effect calls `setShow(false)` unmounts
    // the seeding child synchronously, still inside the deferral window
    // (effect-triggered state updates flush before React yields). Without
    // the `alive` guard the queued microtask would still write `edits` for
    // a question whose editor no longer exists — which
    // `composeStructuredV2Requests` would forward into a submit.
    // `updateResponse`'s own `if (!current) return` does NOT cover this:
    // the question's `responsesAtom` entry is still present while another
    // question's editor is mounted, so `current` is truthy.
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
      await flushTurns(10);
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
