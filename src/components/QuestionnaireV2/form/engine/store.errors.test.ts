import assert from "node:assert/strict";
import { test } from "node:test";

import { Provider, createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { errorsAtom, useQuestionErrors } from "./store";

test("question errors update without rerendering unrelated question subscribers", async () => {
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

  const store = createStore();
  const renders: Record<string, number> = {};
  function QuestionErrors({ questionId }: { questionId: string }) {
    const errors = useQuestionErrors(questionId);
    renders[questionId] = (renders[questionId] ?? 0) + 1;
    return createElement(
      "span",
      { "data-question": questionId },
      errors.map((error) => error.msg).join(", "),
    );
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const errorText = (id: string) =>
    container.querySelector(`[data-question='${id}']`)?.textContent;

  try {
    await act(async () => {
      root.render(
        createElement(
          Provider,
          { store },
          createElement(QuestionErrors, { questionId: "first" }),
          createElement(QuestionErrors, { questionId: "second" }),
        ),
      );
    });
    const initialRenders = { ...renders };
    const firstError = { question_id: "first", msg: "Required" };
    await act(async () => store.set(errorsAtom, [firstError]));
    assert.equal(errorText("first"), "Required");
    assert.ok(renders.first > initialRenders.first);
    assert.equal(renders.second, initialRenders.second);

    const firstRenders = renders.first;
    await act(async () =>
      store.set(errorsAtom, [
        firstError,
        { question_id: "second", msg: "Invalid answer" },
      ]),
    );
    assert.equal(errorText("second"), "Invalid answer");
    assert.equal(renders.first, firstRenders);

    const secondRenders = renders.second;
    await act(async () =>
      store.set(errorsAtom, (errors) =>
        errors.filter((error) => error.question_id !== "first"),
      ),
    );
    assert.equal(errorText("first"), "");
    assert.equal(renders.second, secondRenders);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
