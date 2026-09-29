import assert from "node:assert/strict";
import { test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import type { Question } from "@/types/questionnaire/question";

import { QuestionTreeNav } from "./QuestionTreeNav";

test("the outline reaches deeply nested questions and omits hidden subtrees without renumbering", async () => {
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
  const questions: Question[] = [
    {
      id: "section",
      link_id: "section",
      text: "Section",
      type: "group",
      questions: [
        {
          id: "nested",
          link_id: "nested",
          text: "Nested",
          type: "group",
          questions: [
            { id: "leaf", link_id: "leaf", text: "Leaf", type: "string" },
          ],
        },
      ],
    },
    { id: "last", link_id: "last", text: "Last", type: "string" },
  ];
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: {}, initAsync: false });
  const selected: string[] = [];
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const render = async (hiddenIds?: Set<string>) => {
    await act(async () =>
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(QuestionTreeNav, {
            questions,
            activeId: "leaf",
            onSelect: (id) => selected.push(id),
            ariaLabel: "Questions",
            hiddenIds,
          }),
        ),
      ),
    );
  };
  const buttons = () => [...container.querySelectorAll("button")];
  try {
    await render();
    assert.deepEqual(
      buttons().map((button) => button.textContent),
      ["1.Section", "1.1.Nested", "1.1.1.Leaf", "2.Last"],
    );
    const leaf = buttons()[2];
    assert.equal(leaf.getAttribute("aria-current"), "true");
    await act(async () => leaf.click());
    assert.deepEqual(selected, ["leaf"]);
    await render(new Set(["nested"]));
    assert.deepEqual(
      buttons().map((button) => button.textContent),
      ["1.Section", "2.Last"],
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
