import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { mock, test } from "node:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createInstance } from "i18next";
import { createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { FormStore } from "./StoreRegistrar";
import type { DraftFormSnapshot } from "./draft/fillDraftStore";

function questionnaire(id: string): QuestionnaireRead {
  return {
    id,
    slug: id,
    title: id,
    version: "1",
    status: "active",
    subject_type: "encounter",
    questions: [{ id: "note", link_id: "note", text: "Note", type: "string" }],
  };
}

function draft(form: QuestionnaireRead): DraftFormSnapshot {
  const responses = initializeResponses(form.questions);
  responses.note.values = [{ type: "string", value: "Drafted answer" }];
  return {
    questionnaireId: form.id,
    questionnaireVersion: "1",
    responses,
    structuredSkipped: false,
  };
}

type Session = ReturnType<
  typeof import("./useFillSessionForms").useFillSessionForms
>;

async function withSession(
  run: (harness: {
    session: () => Session;
    stores: Map<string, FormStore>;
    resolveFetch: (form: QuestionnaireRead) => void;
    fetchCalls: () => number;
  }) => Promise<void>,
) {
  // The network client reads Vite's import.meta.env at module load. This
  // harness replaces fetchQuery below, so supply only its inert config here.
  const require = createRequire(import.meta.url);
  const previousModules = new Map<string, NodeJS.Module | undefined>();
  for (const [path, exports] of [
    ["@careConfig", { apiUrl: "http://localhost:9000" }],
    // These fixtures are scalar-only; loading the browser widgets would pull
    // stylesheets into Node. Draft merging itself remains the real code.
    [
      "@/components/QuestionnaireV2/structured/registry",
      { resolveStructuredType: () => undefined },
    ],
  ] as const) {
    const modulePath = require.resolve(path);
    previousModules.set(modulePath, require.cache[modulePath]);
    const module = new Module(modulePath);
    module.exports = exports;
    module.loaded = true;
    require.cache[modulePath] = module;
  }
  const { useFillSessionForms } = await import("./useFillSessionForms");
  const dom = new JSDOM("<!doctype html><div id='root'></div>");
  const globals = {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: {}, initAsync: false });
  const client = new QueryClient();
  let resolveFetch!: (form: QuestionnaireRead) => void;
  const fetched = new Promise<QuestionnaireRead>((resolve) => {
    resolveFetch = resolve;
  });
  const fetchMock = mock.method(client, "fetchQuery", () => fetched);
  const stores = new Map<string, FormStore>();
  const getStore = (key: string) => stores.get(key);
  const primary = questionnaire("primary");
  let session!: Session;
  function Harness() {
    session = useFillSessionForms({ questionnaire: primary, getStore });
    return null;
  }
  const root = createRoot(dom.window.document.getElementById("root")!);
  try {
    await act(async () => {
      root.render(
        createElement(QueryClientProvider, {
          client,
          children: createElement(I18nextProvider, {
            i18n,
            children: createElement(Harness),
          }),
        }),
      );
    });
    await run({
      session: () => session,
      stores,
      resolveFetch,
      fetchCalls: () => fetchMock.mock.callCount(),
    });
  } finally {
    await act(async () => root.unmount());
    fetchMock.mock.restore();
    client.clear();
    for (const [path, module] of previousModules) {
      if (module) require.cache[path] = module;
      else delete require.cache[path];
    }
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("a late restore does not re-add a drafted form removed after picking it", async () => {
  await withSession(async ({ session, resolveFetch }) => {
    const added = questionnaire("added");
    await act(async () => session().onResumeAddedForms([draft(added)]));
    await act(async () => session().addQuestionnaireFromPicker(added));
    assert.equal(session().retainedSnapshots.length, 0);
    assert.equal(
      session().forms[1].initialResponses?.note.values[0].value,
      "Drafted answer",
    );
    await act(async () => session().removeForm(added.id));
    await act(async () => resolveFetch(added));
    assert.deepEqual(
      session().forms.map((form) => form.key),
      ["primary"],
    );
  });
});

test("a late restore leaves newer edits in a picker-restored form intact", async () => {
  await withSession(async ({ session, stores, resolveFetch }) => {
    const added = questionnaire("added");
    await act(async () => session().onResumeAddedForms([draft(added)]));
    await act(async () => session().addQuestionnaireFromPicker(added));
    const store = createStore();
    const responses = initializeResponses(added.questions);
    responses.note.values = [{ type: "string", value: "New clinician edit" }];
    store.set(responsesAtom, responses);
    stores.set(added.id, store);
    await act(async () => resolveFetch(added));
    assert.equal(
      store.get(responsesAtom).note.values[0].value,
      "New clinician edit",
    );
    assert.equal(session().forms.length, 2);
  });
});

test("queued snapshots consumed by the picker are not restored again after an earlier fetch", async () => {
  await withSession(async ({ session, stores, resolveFetch, fetchCalls }) => {
    const first = questionnaire("first");
    const second = questionnaire("second");
    await act(async () =>
      session().onResumeAddedForms([draft(first), draft(second)]),
    );
    await act(async () => session().addQuestionnaireFromPicker(second));
    const store = createStore();
    const responses = initializeResponses(second.questions);
    responses.note.values = [{ type: "string", value: "New second-form edit" }];
    store.set(responsesAtom, responses);
    stores.set(second.id, store);
    await act(async () => resolveFetch(first));
    assert.equal(
      store.get(responsesAtom).note.values[0].value,
      "New second-form edit",
    );
    assert.equal(fetchCalls(), 1);
    assert.equal(session().retainedSnapshots.length, 0);
  });
});

test("a pending restore applies to a newly mounted form before releasing its retained answers", async () => {
  await withSession(async ({ session, stores, resolveFetch }) => {
    const added = questionnaire("added");
    await act(async () => session().onResumeAddedForms([draft(added)]));
    await act(async () => session().addQuestionnaire(added));
    const store = createStore();
    store.set(responsesAtom, initializeResponses(added.questions));
    stores.set(added.id, store);
    await act(async () => resolveFetch(added));
    assert.equal(
      store.get(responsesAtom).note.values[0].value,
      "Drafted answer",
    );
    assert.equal(session().retainedSnapshots.length, 0);
    assert.equal(session().forms.length, 2);
  });
});
