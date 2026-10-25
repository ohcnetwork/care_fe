import assert from "node:assert/strict";
import { test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { ActionExpressionEditor } from "./ActionExpressionEditor";
import type { ActionVariableSources } from "./labels";

test("custom expressions require confirmation before returning to condition rows", async () => {
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
  const sources: ActionVariableSources = {
    questions: [],
    contextValues: [],
    numbers: new Map(),
  };
  let backCount = 0;
  let replacementCount = 0;
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const render = async (condition: string, canUseRules: boolean) => {
    await act(async () => {
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(ActionExpressionEditor, {
            idPrefix: "condition",
            condition,
            sources,
            canUseRules,
            showCustomExpressionNote: !canUseRules,
            onChange: () => assert.fail("opening confirmation must not edit"),
            onBackToConditions: () => backCount++,
            onReplaceCondition: () => replacementCount++,
          }),
        ),
      );
    });
  };
  const click = async (label: string) => {
    const button = [...container.querySelectorAll("button")].find(
      (element) => element.textContent === label,
    );
    assert.ok(button, `Missing button: ${label}`);
    await act(async () => button.click());
  };
  try {
    await render("q_first + 1 > 5", false);
    await click("action_back_to_conditions");
    assert.equal(backCount, 0);
    assert.equal(replacementCount, 0);
    assert.match(
      container.textContent ?? "",
      /action_replace_expression_confirm/,
    );

    await click("action_keep_expression");
    assert.equal(container.querySelector("textarea")?.value, "q_first + 1 > 5");
    assert.equal(replacementCount, 0);

    await click("action_back_to_conditions");
    await click("action_replace_expression");
    assert.equal(replacementCount, 1);

    // Canonical rules return directly, without replacing their expression.
    await render("q_first == 5", true);
    await click("action_back_to_conditions");
    assert.equal(backCount, 1);
    assert.equal(replacementCount, 1);

    await render("", false);
    const textarea = container.querySelector("textarea")!;
    assert.equal(textarea.getAttribute("aria-invalid"), "true");
    assert.equal(
      container.querySelector("#condition-expression-error")?.textContent,
      "action_issue_condition_empty",
    );
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
