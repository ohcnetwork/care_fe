import assert from "node:assert/strict";
import { test } from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import type { Question } from "@/types/questionnaire/question";

import { RegisteredGroupAnswerView } from "./RegisteredGroupAnswerView";
import { RegisteredGroupView } from "./RegisteredGroupView";
import {
  registerQuestionGroup,
  type GroupInputProps,
  type RegisteredGroupDefinition,
} from "./registry";

test("registered groups preserve fallback, nullable fields, and recovery after a renderer fails", async (context) => {
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
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const question: Question = {
    id: "group",
    link_id: "group",
    text: "Registered group",
    type: "group",
    structured_type: "view_test.group",
    questions: [],
  };
  const received: GroupInputProps[] = [];
  function Custom(props: GroupInputProps) {
    received.push(props);
    return createElement("p", null, "Custom group");
  }
  const definition: RegisteredGroupDefinition = {
    type: "view_test.group",
    label: "Test group",
    subjects: ["encounter"],
    schema: [{ link_id: "child", type: "string", text: "Child" }],
    builder: () => null,
    component: Custom,
  };
  const registrations: (() => void)[] = [];
  const register = async (next: RegisteredGroupDefinition) => {
    await act(async () => {
      registrations.push(registerQuestionGroup(next, "view_test"));
    });
  };
  const logged = context.mock.method(console, "error", () => {});
  try {
    await act(async () => {
      root.render(
        createElement(RegisteredGroupView, {
          question,
          fields: { child: null },
          onChange: () => {},
          rows: [],
          addRow: () => {},
          disabled: true,
          fallback: createElement("p", null, "Ordinary child questions"),
        }),
      );
    });
    assert.equal(container.textContent, "Ordinary child questions");

    await register(definition);
    assert.equal(container.textContent, "Custom group");
    assert.equal(received.at(-1)?.question, question);
    assert.equal(received.at(-1)?.fields.child, null);
    assert.equal(received.at(-1)?.disabled, true);
    assert.equal(logged.mock.calls.length, 0);

    const failure = new Error("Renderer failed");
    await register({
      ...definition,
      component: () => {
        throw failure;
      },
    });
    assert.equal(container.textContent, "Ordinary child questions");
    assert.ok(
      logged.mock.calls.some((call) =>
        (call.arguments as unknown[]).includes(failure),
      ),
    );

    received.length = 0;
    await register({ ...definition });
    assert.equal(container.textContent, "Custom group");
    assert.equal(received.at(-1)?.fields.child, null);

    await register({ ...definition, repeats: true });
    const saved: Question = {
      ...question,
      repeats: true,
      questions: [
        {
          id: "child-id",
          link_id: "group__child",
          type: "string",
          text: "Child",
        },
      ],
    };
    await act(async () => {
      root.render(
        createElement(RegisteredGroupAnswerView, {
          question: saved,
          responses: [
            {
              question_id: "group",
              sub_results: [
                [{ question_id: "child-id", values: [{ value: "First" }] }],
                [{ question_id: "child-id", values: [{ value: "Second" }] }],
              ],
            },
          ],
          fallback: createElement("p", null, "Ordinary child questions"),
        }),
      );
    });
    assert.deepEqual(
      received
        .at(-1)
        ?.rows.map((row) => row.fields.child?.response.values[0].value),
      ["First", "Second"],
    );
    assert.equal(received.at(-1)?.disabled, true);
  } finally {
    await act(async () => root.unmount());
    registrations.forEach((unregister) => unregister());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
