import assert from "node:assert/strict";
import { test } from "node:test";

import { Provider, createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import {
  questionnaireAtom,
  responsesAtom,
  useHiddenQuestionIds,
} from "./store";

test("hidden groups hide every descendant while protected groups retain their children", async () => {
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
  const condition: Question["enable_when"] = [
    { question: "switch", operator: "equals", answer: true },
  ];
  const questionnaire: QuestionnaireRead = {
    id: "questionnaire",
    title: "Questionnaire",
    slug: "questionnaire",
    status: "active",
    subject_type: "encounter",
    questions: [
      { id: "switch", link_id: "switch", text: "Switch", type: "boolean" },
      {
        id: "hidden",
        link_id: "hidden",
        text: "Hidden group",
        type: "group",
        enable_when: condition,
        questions: [
          {
            id: "nested",
            link_id: "nested",
            text: "Nested group",
            type: "group",
            disabled_display: "protected",
            questions: [
              { id: "leaf", link_id: "leaf", text: "Leaf", type: "string" },
            ],
          },
        ],
      },
      {
        id: "protected",
        link_id: "protected",
        text: "Protected group",
        type: "group",
        enable_when: condition,
        disabled_display: "protected",
        questions: [
          {
            id: "visible",
            link_id: "visible",
            text: "Visible",
            type: "string",
          },
        ],
      },
    ],
  };
  const store = createStore();
  store.set(questionnaireAtom, questionnaire);
  function HiddenQuestions() {
    return createElement(
      "output",
      null,
      [...useHiddenQuestionIds()].sort().join(","),
    );
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  try {
    await act(async () => {
      root.render(
        createElement(Provider, { store }, createElement(HiddenQuestions)),
      );
    });
    assert.equal(container.textContent, "hidden,leaf,nested");
    await act(async () => {
      store.set(responsesAtom, {
        switch: {
          question_id: "switch",
          link_id: "switch",
          structured_type: null,
          values: [{ type: "boolean", value: true }],
        },
      });
    });
    assert.equal(container.textContent, "");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
