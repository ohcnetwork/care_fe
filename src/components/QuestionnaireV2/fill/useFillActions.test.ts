import assert from "node:assert/strict";
import { test } from "node:test";

import { createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import {
  errorsAtom,
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { FillFormEntry } from "./formSession";
import type { FillSubject } from "./subject";
import { useFillActions } from "./useFillActions";

test("registered Scribe writes respect the current freeze and recover after saving", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>");
  const globals = {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previousGlobals = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }

  const forms: FillFormEntry[] = [
    {
      key: "form",
      isPrimary: true,
      questionnaire: {
        id: "form",
        slug: "form",
        title: "Clinical note",
        version: "1",
        status: "active",
        subject_type: "encounter",
        questions: [
          { id: "note", link_id: "note", text: "Note", type: "string" },
        ],
      },
    },
  ];
  const subject: FillSubject = {
    type: "encounter",
    patientId: "patient",
    encounterId: "encounter",
    facilityId: "facility",
  };
  const store = createStore();
  store.set(
    responsesAtom,
    initializeResponses(forms[0].questionnaire.questions),
  );
  const getStore = () => store;
  let actions: ReturnType<typeof useFillActions> | undefined;
  function Harness({ frozen }: { frozen: boolean }) {
    actions = useFillActions({ subject, forms, getStore, frozen });
    return null;
  }

  const root = createRoot(dom.window.document.getElementById("root")!);
  try {
    await act(async () =>
      root.render(createElement(Harness, { frozen: false })),
    );
    assert.ok(actions);
    // A plugin may hold this callback while its transcription is pending.
    const invoke = actions.invoke;
    assert.deepEqual(
      await invoke("questionnaire.response.set", {
        link_id: "note",
        values: ["Captured before save"],
      }),
      { ok: true },
    );
    const responsesBeforeSave = store.get(responsesAtom);
    const errorsBeforeSave = [
      { question_id: "note", error: "Keep this error" },
    ];
    store.set(errorsAtom, errorsBeforeSave);

    await act(async () =>
      root.render(createElement(Harness, { frozen: true })),
    );
    const rejected = await invoke("questionnaire.response.set", {
      link_id: "note",
      values: ["Late transcription"],
      note: "Late annotation",
    });
    assert.equal(rejected.ok, false);
    assert.equal(store.get(responsesAtom), responsesBeforeSave);
    assert.equal(store.get(errorsAtom), errorsBeforeSave);
    assert.equal((await invoke("questionnaire.forms.list", {})).ok, true);

    // A failed save restores editing without requiring the plugin to obtain
    // a new callback or remount its session.
    await act(async () =>
      root.render(createElement(Harness, { frozen: false })),
    );
    assert.deepEqual(
      await invoke("questionnaire.response.set", {
        link_id: "note",
        values: ["Corrected after failure"],
      }),
      { ok: true },
    );
    assert.equal(
      store.get(responsesAtom).note.values[0].value,
      "Corrected after failure",
    );
    assert.deepEqual(store.get(errorsAtom), []);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
