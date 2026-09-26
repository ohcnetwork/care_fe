import assert from "node:assert/strict";
import { test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { useQuestionImport } from "./useQuestionImport";

function deferredText() {
  let resolve!: (text: string) => void;
  const promise = new Promise<string>((done) => (resolve = done));
  return { promise, resolve };
}

const questionnaireJson = (text: string) =>
  JSON.stringify({
    questions: [{ link_id: "question", type: "string", text }],
  });

async function mountImport(onReady: () => void) {
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
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: {}, initAsync: false });
  let state!: ReturnType<typeof useQuestionImport>;
  function Harness() {
    state = useQuestionImport(onReady);
    return null;
  }
  const root = createRoot(dom.window.document.getElementById("root")!);
  const render = async (show: boolean) => {
    await act(async () => {
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          show ? createElement(Harness) : null,
        ),
      );
    });
  };
  await render(true);
  return {
    current: () => state,
    render,
    async cleanup() {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of previousGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test("a newer source owns pending questions even when an old fetch ignores abort", async (t) => {
  const ready = t.mock.fn();
  const view = await mountImport(ready);
  t.after(() => view.cleanup());
  const oldText = deferredText();
  let signal: AbortSignal | undefined;
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: RequestInfo | URL, options: RequestInit) => {
      signal = options.signal ?? undefined;
      const response = new Response("", {
        headers: { "content-type": "application/json" },
      });
      response.text = () => oldText.promise;
      return response;
    },
  );
  let pending!: Promise<void>;
  await act(async () => {
    pending = view.current().importUrl("https://example.com/old.json");
  });
  assert.equal(view.current().isFetching, true);
  await act(async () => {
    await view
      .current()
      .importFile(new File([questionnaireJson("New file")], "new.json"));
  });
  assert.equal(signal?.aborted, true);
  assert.equal(view.current().isFetching, false);
  assert.equal(view.current().pendingQuestions?.[0].text, "New file");
  await act(async () => {
    oldText.resolve(questionnaireJson("Old URL"));
    await pending;
  });
  assert.equal(view.current().pendingQuestions?.[0].text, "New file");
  assert.equal(ready.mock.callCount(), 1);
});

test("cancelled file reads cannot finish into a newly opened import session", async (t) => {
  const ready = t.mock.fn();
  const view = await mountImport(ready);
  t.after(() => view.cleanup());
  const oldText = deferredText();
  const file = new File([], "old.json");
  file.text = () => oldText.promise;
  let pending!: Promise<void>;
  await act(async () => {
    pending = view.current().importFile(file);
  });
  await view.render(false);
  await view.render(true);
  await act(async () => {
    oldText.resolve(questionnaireJson("Old file"));
    await pending;
  });
  assert.deepEqual(view.current().pendingQuestions, null);
  assert.equal(view.current().fileError, "");
  assert.equal(ready.mock.callCount(), 0);
});

test("an old URL completion cannot stop a newer request's loading state", async (t) => {
  const ready = t.mock.fn();
  const view = await mountImport(ready);
  t.after(() => view.cleanup());
  const first = deferredText();
  const second = deferredText();
  t.mock.method(globalThis, "fetch", async (url: string) => {
    const response = new Response("", {
      headers: { "content-type": "application/json" },
    });
    response.text = () => (url.endsWith("first") ? first : second).promise;
    return response;
  });
  let oldRequest!: Promise<void>;
  let newRequest!: Promise<void>;
  await act(async () => {
    oldRequest = view.current().importUrl("https://example.com/first");
  });
  await act(async () => {
    newRequest = view.current().importUrl("https://example.com/second");
  });
  await act(async () => {
    first.resolve(questionnaireJson("Old URL"));
    await oldRequest;
  });
  assert.equal(view.current().isFetching, true);
  assert.deepEqual(view.current().pendingQuestions, null);
  await act(async () => {
    second.resolve(questionnaireJson("Current URL"));
    await newRequest;
  });
  assert.equal(view.current().isFetching, false);
  assert.equal(view.current().pendingQuestions?.[0].text, "Current URL");
  assert.equal(ready.mock.callCount(), 1);
});
