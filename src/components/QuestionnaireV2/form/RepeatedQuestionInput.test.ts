import assert from "node:assert/strict";
import { test } from "node:test";

import { createInstance } from "i18next";
import { useStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { QuestionnaireFormProvider } from "./FormContext";
import { RepeatedQuestionInput } from "./RepeatedQuestionInput";
import type { RendererInputProps } from "./engine/questionTypeRegistry";
import { responsesAtom, useQuestionResponse } from "./engine/store";

async function withRepeatedInput(
  values: string[],
  run: (harness: {
    container: HTMLElement;
    store: ReturnType<typeof useStore>;
    render: (frozen: boolean) => Promise<void>;
    click: (label: string, index?: number) => Promise<void>;
  }) => Promise<void>,
) {
  const dom = new JSDOM("<!doctype html><div id='root'></div>");
  const globals = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    MutationObserver: dom.window.MutationObserver,
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
  const question = {
    id: "repeated",
    link_id: "repeated",
    text: "Repeated answer",
    type: "string" as const,
    repeats: true,
  };
  const questionnaire: QuestionnaireRead = {
    id: "form",
    slug: "form",
    title: "Form",
    version: "1",
    status: "active",
    subject_type: "encounter",
    questions: [question],
  };
  let store: ReturnType<typeof useStore>;
  // A locally buffered input makes a misplaced React key observable: edits
  // not yet committed to the answer store must travel with their own row.
  function BufferedInput({
    question,
    valueIndex = 0,
    inputId,
    disabled,
  }: RendererInputProps) {
    store = useStore();
    const [response] = useQuestionResponse(question.id);
    return createElement("input", {
      id: inputId,
      defaultValue: String(response?.values[valueIndex]?.value ?? ""),
      disabled,
    });
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: {}, initAsync: false });
  const render = async (frozen: boolean) => {
    await act(async () => {
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(QuestionnaireFormProvider, {
            questionnaire,
            mode: "fill",
            frozen,
            initialResponses: {
              repeated: {
                question_id: question.id,
                structured_type: null,
                link_id: question.link_id,
                values: values.map((value) => ({
                  type: "string" as const,
                  value,
                })),
              },
            },
            children: createElement(RepeatedQuestionInput, {
              question,
              inputId: "answer",
              labelId: "label",
              disabled: frozen,
              locked: false,
              component: BufferedInput,
            }),
          }),
        ),
      );
    });
  };
  const click = async (label: string, index = 0) => {
    const buttons = [...container.querySelectorAll("button")].filter(
      (button) =>
        button.getAttribute("aria-label") === label ||
        button.textContent === label,
    );
    assert.ok(buttons[index], `Missing button: ${label}`);
    await act(async () => buttons[index].click());
  };
  try {
    await render(false);
    await run({ container, store: store!, render, click });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("adding to an empty repeated answer materializes its placeholder and preserves the surviving row", async () => {
  await withRepeatedInput([], async ({ container, store, click }) => {
    const placeholder = container.querySelector("input");
    assert.ok(placeholder);
    await click("add_another");
    assert.equal(container.querySelectorAll("input").length, 2);
    assert.equal(container.querySelector("input"), placeholder);
    assert.equal(store.get(responsesAtom).repeated.values.length, 2);

    const survivor = container.querySelectorAll("input")[1];
    survivor.value = "Uncommitted input";
    await click("remove", 0);
    assert.equal(placeholder.isConnected, false);
    assert.equal(container.querySelector("input"), survivor);
    assert.equal(survivor.value, "Uncommitted input");
    await click("add_another");
    assert.equal(container.querySelector("input"), survivor);
    assert.notEqual(container.querySelectorAll("input")[1], placeholder);
  });
});

test("removing a middle entry and freezing a submit keep remaining buffers with their rows", async () => {
  await withRepeatedInput(
    ["First", "Second", "Third"],
    async ({ container, store, render, click }) => {
      const [first, second, third] = container.querySelectorAll("input");
      third.value = "Pending third edit";
      await click("remove", 1);
      assert.deepEqual(
        store.get(responsesAtom).repeated.values.map((entry) => entry.value),
        ["First", "Third"],
      );
      assert.equal(second.isConnected, false);
      assert.equal(container.querySelectorAll("input")[0], first);
      assert.equal(container.querySelectorAll("input")[1], third);
      assert.equal(third.value, "Pending third edit");

      await render(true);
      assert.equal(container.querySelectorAll("input")[1], third);
      assert.equal(third.disabled, true);
      assert.ok(
        [...container.querySelectorAll("button")].every(
          (button) => button.disabled,
        ),
      );
      await render(false);
      assert.equal(container.querySelectorAll("input")[1], third);
      assert.equal(third.disabled, false);
      assert.equal(third.value, "Pending third edit");
    },
  );
});
