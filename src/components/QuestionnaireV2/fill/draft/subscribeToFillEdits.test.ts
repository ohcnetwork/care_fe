import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { before, test } from "node:test";

import { createStore } from "jotai";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

let subscribeToFillEdits: typeof import("./subscribeToFillEdits").subscribeToFillEdits;

before(async () => {
  // Scalar fixtures exercise the real signatures without importing the
  // browser-only structured widget registry (and its stylesheets) into Node.
  const require = createRequire(import.meta.url);
  const path =
    require.resolve("@/components/QuestionnaireV2/structured/registry");
  const previous = require.cache[path];
  const registry = new Module(path);
  registry.exports = { resolveStructuredType: () => undefined };
  registry.loaded = true;
  require.cache[path] = registry;
  try {
    ({ subscribeToFillEdits } = await import("./subscribeToFillEdits"));
  } finally {
    if (previous) require.cache[path] = previous;
    else delete require.cache[path];
  }
});

function observedForm(id: string) {
  const questionnaire: QuestionnaireRead = {
    id,
    slug: id,
    title: id,
    version: "1",
    status: "active",
    subject_type: "encounter",
    questions: [{ id: "note", link_id: "note", text: "Note", type: "string" }],
  };
  const store = createStore();
  store.set(responsesAtom, initializeResponses(questionnaire.questions));
  return { questionnaire, store };
}

function edit(form: ReturnType<typeof observedForm>, value: string) {
  form.store.set(responsesAtom, (responses) => ({
    note: {
      ...responses.note,
      values: [{ type: "string", value }],
    },
  }));
}

test("all forms share one debounce and equivalent writes do not trigger another save", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const first = observedForm("first");
  const second = observedForm("second");
  const onEdit = t.mock.fn();
  const persist = t.mock.fn();
  const subscription = subscribeToFillEdits([first, second], {
    isFinished: () => false,
    onEdit,
    persist,
  });
  t.after(() => subscription.dispose());

  edit(first, "First edit");
  t.mock.timers.tick(1000);
  edit(second, "Second edit");
  t.mock.timers.tick(1000);
  edit(first, "Final edit");
  t.mock.timers.tick(1499);
  assert.equal(persist.mock.callCount(), 0);
  t.mock.timers.tick(1);
  assert.equal(onEdit.mock.callCount(), 3);
  assert.equal(persist.mock.callCount(), 1);

  // Equivalent immutable response writes must not mark another edit or save.
  edit(first, "Final edit");
  t.mock.timers.tick(2000);
  assert.equal(onEdit.mock.callCount(), 3);
  assert.equal(persist.mock.callCount(), 1);
});

test("manual flush runs once and subsequent edits can still autosave", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const form = observedForm("form");
  const persist = t.mock.fn();
  const subscription = subscribeToFillEdits([form], {
    isFinished: () => false,
    onEdit: () => {},
    persist,
  });
  t.after(() => subscription.dispose());

  edit(form, "Before flush");
  subscription.flush();
  subscription.flush();
  t.mock.timers.tick(2000);
  assert.equal(persist.mock.callCount(), 1);
  edit(form, "After flush");
  t.mock.timers.tick(1500);
  assert.equal(persist.mock.callCount(), 2);
});

test("dispose flushes the pending edit and unsubscribes every form", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const forms = [observedForm("first"), observedForm("second")];
  const cleanups = forms.map(({ store }) => {
    const subscribe = store.sub.bind(store);
    const cleanup = t.mock.fn();
    t.mock.method(store, "sub", (...args: Parameters<typeof store.sub>) => {
      const unsubscribe = subscribe(...args);
      return () => {
        cleanup();
        unsubscribe();
      };
    });
    return cleanup;
  });
  const onEdit = t.mock.fn();
  const persist = t.mock.fn();
  const subscription = subscribeToFillEdits(forms, {
    isFinished: () => false,
    onEdit,
    persist,
  });
  edit(forms[0], "Final edit");
  subscription.dispose();
  subscription.dispose();
  edit(forms[0], "After unmount");
  edit(forms[1], "After unmount");
  t.mock.timers.tick(2000);
  assert.equal(onEdit.mock.callCount(), 1);
  assert.equal(persist.mock.callCount(), 1);
  assert.deepEqual(
    cleanups.map((cleanup) => cleanup.mock.callCount()),
    [1, 1],
  );
});

test("successful submission prevents both pending and later autosaves", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const form = observedForm("form");
  let finished = false;
  const onEdit = t.mock.fn();
  const persist = t.mock.fn();
  const subscription = subscribeToFillEdits([form], {
    isFinished: () => finished,
    onEdit,
    persist,
  });
  edit(form, "Submitted");
  finished = true;
  t.mock.timers.tick(1500);
  edit(form, "Late store update");
  subscription.dispose();
  assert.equal(onEdit.mock.callCount(), 1);
  assert.equal(persist.mock.callCount(), 0);
});

test("disposal releases subscriptions even if persistence throws", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const form = observedForm("form");
  const subscribe = form.store.sub.bind(form.store);
  const cleanup = t.mock.fn();
  t.mock.method(
    form.store,
    "sub",
    (...args: Parameters<typeof form.store.sub>) => {
      const unsubscribe = subscribe(...args);
      return () => {
        cleanup();
        unsubscribe();
      };
    },
  );
  const subscription = subscribeToFillEdits([form], {
    isFinished: () => false,
    onEdit: () => {},
    persist: () => {
      throw new Error("Storage unavailable");
    },
  });
  edit(form, "Final edit");
  assert.throws(() => subscription.dispose(), /Storage unavailable/);
  assert.equal(cleanup.mock.callCount(), 1);
  assert.doesNotThrow(() => t.mock.timers.tick(2000));
});
