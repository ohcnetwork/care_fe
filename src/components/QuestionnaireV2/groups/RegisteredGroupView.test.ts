import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";
import type { Question } from "@/types/questionnaire/question";

import { RegisteredGroupAnswerView } from "./RegisteredGroupAnswerView";
import { RegisteredGroupView } from "./RegisteredGroupView";
import {
  registerQuestionGroup,
  type GroupInputProps,
  type RegisteredGroupDefinition,
} from "./registry";

test("registered groups preserve fallback, renderer recovery and surviving row buffers", async (context) => {
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
  const require = createRequire(import.meta.url);
  const previousModules = new Map<string, NodeJS.Module | undefined>();
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

    // Only replace fallback UI. The registered slot, provider, bindings, row
    // operations and plugin component remain real throughout this regression.
    for (const [path, name] of [
      ["@/components/QuestionnaireV2/form/QuestionBlock", "QuestionBlock"],
      ["@/components/QuestionnaireV2/form/RepeatingGroup", "RepeatingGroup"],
      ["@/components/QuestionnaireV2/form/SectionCard", "SectionCard"],
    ]) {
      const modulePath = require.resolve(path);
      previousModules.set(modulePath, require.cache[modulePath]);
      const module = new Module(modulePath);
      module.exports = { [name]: () => null };
      module.loaded = true;
      require.cache[modulePath] = module;
    }
    const { RegisteredGroupSlot } = await import("./RegisteredGroupSlot");
    function BufferedRows(props: GroupInputProps) {
      received.push(props);
      return createElement(
        "div",
        null,
        props.rows.map((row) =>
          createElement(
            "div",
            { key: row.key },
            createElement("input", {
              defaultValue: String(
                row.fields.child?.response.values[0]?.value ?? "",
              ),
            }),
            createElement("button", { onClick: row.remove }, "Remove row"),
            createElement(
              "button",
              {
                onClick: () => row.onChange({ child: { note: "Saved note" } }),
              },
              "Update row",
            ),
          ),
        ),
        createElement("button", { onClick: () => props.addRow() }, "Add row"),
      );
    }
    await register({ ...definition, repeats: true, component: BufferedRows });
    const i18n = createInstance();
    await i18n.init({ lng: "en", resources: {}, initAsync: false });
    await act(async () => {
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(QuestionnaireFormProvider, {
            questionnaire: {
              id: "form",
              slug: "form",
              title: "Form",
              status: "active",
              subject_type: "encounter",
              questions: [saved],
            },
            mode: "fill",
            initialResponses: {
              group: {
                question_id: "group",
                link_id: "group",
                structured_type: "view_test.group",
                values: [],
                sub_results: ["First", "Second", "Third"].map((value) => [
                  {
                    question_id: "child-id",
                    link_id: "group__child",
                    structured_type: null,
                    values: [{ type: "string" as const, value }],
                  },
                ]),
              },
            },
            children: createElement(RegisteredGroupSlot, {
              question: saved,
              depth: 0,
              disabled: false,
            }),
          }),
        ),
      );
    });
    const click = async (label: string, index = 0) => {
      const button = [...container.querySelectorAll("button")].filter(
        (button) => button.textContent === label,
      )[index];
      assert.ok(button, `Missing button: ${label}`);
      await act(async () => button.click());
    };
    const [first, second, third] = container.querySelectorAll("input");
    const initialKeys = received.at(-1)!.rows.map((row) => row.key);
    assert.equal(new Set(initialKeys).size, 3);
    third.value = "Pending third edit";
    await click("Update row", 2);
    assert.deepEqual(
      received.at(-1)!.rows.map((row) => row.key),
      initialKeys,
    );
    assert.equal(container.querySelectorAll("input")[2], third);
    await click("Remove row", 1);
    assert.equal(second.isConnected, false);
    assert.equal(container.querySelectorAll("input")[0], first);
    assert.equal(container.querySelectorAll("input")[1], third);
    assert.equal(third.value, "Pending third edit");
    await click("Add row");
    const appended = container.querySelectorAll("input")[2];
    const newKey = received.at(-1)!.rows[2].key;
    assert.equal(initialKeys.includes(newKey), false);
    const [firstRow, thirdRow] = received.at(-1)!.rows;
    await act(async () => {
      firstRow.remove();
      thirdRow.remove();
    });
    assert.equal(container.querySelectorAll("input").length, 1);
    assert.equal(container.querySelector("input"), appended);
  } finally {
    await act(async () => root.unmount());
    registrations.forEach((unregister) => unregister());
    dom.window.close();
    for (const [path, module] of previousModules) {
      if (module) require.cache[path] = module;
      else delete require.cache[path];
    }
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
