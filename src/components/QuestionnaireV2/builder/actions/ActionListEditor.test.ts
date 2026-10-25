import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { before, test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import type { QuestionnaireAction } from "@/types/questionnaire/actions";

let ActionListEditor: typeof import("./ActionListEditor").ActionListEditor;
before(async () => {
  // The unused tag picker imports the browser network configuration.
  // Keep the real editor tree while supplying Node's missing Vite env.
  const require = createRequire(import.meta.url);
  const path = require.resolve("@careConfig");
  const previous = require.cache[path];
  const config = new Module(path);
  config.exports = { apiUrl: "http://localhost:9000" };
  config.loaded = true;
  require.cache[path] = config;
  try {
    ({ ActionListEditor } = await import("./ActionListEditor"));
  } finally {
    if (previous) require.cache[path] = previous;
    else delete require.cache[path];
  }
});

async function withEditor(run: (container: HTMLElement) => Promise<void>) {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    pretendToBeVisual: true,
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
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
  await i18n.init({
    lng: "en",
    resources: {
      en: { translation: { delete_action: "Delete action {{n}}" } },
    },
    initAsync: false,
  });
  function Harness() {
    const [actions, setActions] = useState<QuestionnaireAction[]>([
      { condition: "True", instructions: [] },
      {
        condition: "True",
        instructions: ["first", "second"].map((message) => ({
          slug: "logging",
          context: "self",
          params: { data: { message } },
        })),
      },
    ]);
    const [openIndex, setOpenIndex] = useState<number | null>(1);
    return createElement(ActionListEditor, {
      contextType: "Appointment",
      questions: [],
      actions,
      issues: [],
      openIndex,
      onOpenIndexChange: setOpenIndex,
      onActionsChange: setActions,
      emptyHint: "",
      registry: {
        instructions: [
          {
            slug: "logging",
            context: "Appointment",
            instruction_type: "NOTIFY",
            input_schema: {
              properties: { data: { type: "object", title: "Data" } },
            },
            output_schema: {},
          },
        ],
        fields: [],
        isLoading: false,
        isError: false,
      },
    });
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement(I18nextProvider, {
          i18n,
          children: createElement(Harness),
        }),
      ),
    );
    await run(container);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("deleting an earlier action preserves the surviving action's expression editor", async () => {
  await withEditor(async (container) => {
    const edit = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "action_edit_as_expression",
    );
    assert.ok(edit);
    await act(async () => edit.click());
    assert.ok(
      container.querySelector('textarea[aria-label="action_expression"]'),
    );
    const remove = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Delete action 1"]',
    );
    assert.ok(remove);
    await act(async () => remove.click());
    assert.equal(
      container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="action_expression"]',
      )?.value,
      "True",
    );
  });
});

test("deleting an earlier instruction keeps the surviving JSON input with its instruction", async () => {
  await withEditor(async (container) => {
    const inputs = () =>
      [
        ...container.querySelectorAll<HTMLTextAreaElement>(
          'textarea[aria-label="Data"]',
        ),
      ].map((input) => JSON.parse(input.value));
    assert.deepEqual(inputs(), [{ message: "first" }, { message: "second" }]);
    const remove = container.querySelector<HTMLButtonElement>(
      'button[aria-label="action_remove_instruction"]',
    );
    assert.ok(remove);
    await act(async () => remove.click());
    assert.deepEqual(inputs(), [{ message: "second" }]);
  });
});
