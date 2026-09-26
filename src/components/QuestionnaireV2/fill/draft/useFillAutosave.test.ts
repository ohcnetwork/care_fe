import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { before, test } from "node:test";

import i18next from "i18next";
import { createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { initReactI18next } from "react-i18next";
import { toast } from "sonner";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";

import { fillDraftStorageKey } from "./fillDraftCache";

let useFillSessionAutosave: typeof import("./useFillAutosave").useFillSessionAutosave;

before(async () => {
  // Scalar answers exercise persistence without loading browser-only
  // structured widgets and their stylesheets in Node.
  const require = createRequire(import.meta.url);
  const path =
    require.resolve("@/components/QuestionnaireV2/structured/registry");
  const previous = require.cache[path];
  const registry = new Module(path);
  registry.exports = { resolveStructuredType: () => undefined };
  registry.loaded = true;
  require.cache[path] = registry;
  try {
    ({ useFillSessionAutosave } = await import("./useFillAutosave"));
  } finally {
    if (previous) require.cache[path] = previous;
    else delete require.cache[path];
  }
  await i18next.use(initReactI18next).init({
    lng: "en",
    resources: {
      en: {
        translation: {
          questionnaire_draft_save_failed: "Draft was not saved on this device",
        },
      },
    },
  });
});

test("autosave warns once while storage fails and resumes saving when storage recovers", async (t) => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    url: "https://care.example",
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
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
  const toastError = t.mock.method(toast, "error", () => "toast-id");
  const store = createStore();
  const form: FillFormEntry = {
    key: "questionnaire",
    isPrimary: true,
    questionnaire: {
      id: "questionnaire",
      slug: "questionnaire",
      title: "Questionnaire",
      status: "active",
      subject_type: "encounter",
      questions: [
        { id: "note", link_id: "note", text: "Note", type: "string" },
      ],
    },
  };
  const scope = {
    userId: "user",
    subjectKey: "encounter:visit",
    entryQuestionnaireId: form.key,
  };
  const forms = [form];
  const getStore = () => store;
  const onResumeAddedForms = () => {};
  function Autosave() {
    const { dirty } = useFillSessionAutosave({
      scope,
      forms,
      getStore,
      storesVersion: 0,
      restoredDraft: undefined,
      onResumeAddedForms,
    });
    return createElement("output", null, String(dirty));
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const editAndFlush = async (value: string) => {
    await act(async () => {
      store.set(responsesAtom, {
        note: {
          question_id: "note",
          link_id: "note",
          structured_type: null,
          values: [{ type: "string", value }],
        },
      });
      dom.window.dispatchEvent(new dom.window.Event("pagehide"));
    });
  };
  try {
    await act(async () => root.render(createElement(Autosave)));
    const write = t.mock.method(dom.window.Storage.prototype, "setItem", () => {
      throw new Error("Quota exceeded");
    });
    // Empty, non-persistable edits must not be reported as write failures.
    await editAndFlush("");
    assert.equal(toastError.mock.callCount(), 0);
    await editAndFlush("First answer");
    assert.equal(toastError.mock.callCount(), 1);
    assert.equal(
      toastError.mock.calls[0].arguments[0],
      "Draft was not saved on this device",
    );
    assert.equal(container.textContent, "true");
    assert.equal(localStorage.getItem(fillDraftStorageKey(scope)), null);
    await editAndFlush("Second answer");
    assert.equal(toastError.mock.callCount(), 1);
    write.mock.restore();
    await editAndFlush("Recovered answer");
    assert.equal(
      JSON.parse(localStorage.getItem(fillDraftStorageKey(scope))!).forms[0]
        .responses.note.values[0].value,
      "Recovered answer",
    );
    assert.equal(toastError.mock.callCount(), 1);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
