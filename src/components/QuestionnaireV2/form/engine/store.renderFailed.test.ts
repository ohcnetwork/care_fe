import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { before, test } from "node:test";

import type { TFunction } from "i18next";
import { Provider, createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

let composeBatch: typeof import("@/components/QuestionnaireV2/fill/submit/composeBatch").composeBatch;
let collectStructuredErrors: typeof import("@/components/QuestionnaireV2/fill/submit/validateStructured").collectStructuredErrors;

before(async () => {
  // Keep browser widgets out of Node. The mounted failure-key hooks,
  // submission pipeline and time-of-death request builder are real.
  const require = createRequire(import.meta.url);
  const replaced = new Map<string, NodeJS.Module | undefined>();
  const replace = (specifier: string, exports: unknown) => {
    const path = require.resolve(specifier);
    replaced.set(path, require.cache[path]);
    const replacement = new Module(path);
    replacement.exports = exports;
    replacement.loaded = true;
    require.cache[path] = replacement;
  };
  replace("@/components/QuestionnaireV2/structured/inputs/TimeOfDeathInput", {
    TimeOfDeathInput: () => null,
  });
  try {
    const { timeOfDeathDefinition } =
      await import("@/components/QuestionnaireV2/structured/definitions/timeOfDeath");
    replace("@/components/QuestionnaireV2/structured/registry", {
      resolveStructuredSlotState: () => ({
        kind: "ready",
        definition: timeOfDeathDefinition,
      }),
      structuredDataAny: (response: QuestionnaireResponse) =>
        response.values[0]?.value ?? [],
    });
    ({ composeBatch } =
      await import("@/components/QuestionnaireV2/fill/submit/composeBatch"));
    ({ collectStructuredErrors } =
      await import("@/components/QuestionnaireV2/fill/submit/validateStructured"));
  } finally {
    for (const [path, previous] of replaced) {
      if (previous) require.cache[path] = previous;
      else delete require.cache[path];
    }
  }
});

import { ResponseRowProvider } from "./responseScope";
import {
  renderFailedKey,
  responsesAtom,
  structuredRenderFailedAtom,
  useClearStructuredRenderFailed,
  useMarkStructuredRenderFailed,
  useQuestionResponse,
} from "./store";

test("render-failed marks guard required validation and submission per row, and drop when rows change", async () => {
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
  const row = (value: string) => [
    {
      question_id: "child",
      link_id: "child",
      structured_type: "time_of_death" as const,
      values: [{ type: "time_of_death" as const, value: [value] }],
    },
  ];
  store.set(responsesAtom, {
    group: {
      question_id: "group",
      link_id: "group",
      structured_type: null,
      values: [],
      sub_results: [row("2026-01-01T00:00:00Z"), row("2026-01-02T00:00:00Z")],
    },
    root: {
      question_id: "root",
      link_id: "root",
      structured_type: "time_of_death",
      values: [{ type: "time_of_death", value: ["2026-01-03T00:00:00Z"] }],
    },
  });
  const questionnaire: QuestionnaireRead = {
    id: "form",
    slug: "form",
    title: "Form",
    version: "1",
    status: "active",
    subject_type: "patient",
    questions: [
      {
        id: "root",
        link_id: "root",
        text: "Root",
        type: "structured",
        structured_type: "time_of_death",
        required: true,
      },
      {
        id: "group",
        link_id: "group",
        text: "Group",
        type: "group",
        repeats: true,
        questions: [
          {
            id: "child",
            link_id: "child",
            text: "Child",
            type: "structured",
            structured_type: "time_of_death",
            required: true,
          },
        ],
      },
    ],
  };
  const compose = () =>
    composeBatch({
      questionnaire,
      responses: store.get(responsesAtom),
      renderFailed: store.get(structuredRenderFailedAtom),
      subject: { type: "patient", patientId: "patient" },
    });
  const validate = () =>
    collectStructuredErrors(
      questionnaire,
      store.get(responsesAtom),
      { patientId: "patient" },
      store.get(structuredRenderFailedAtom),
      ((key: string) => key) as TFunction,
    );

  function Slot({ id }: { id: string }) {
    const mark = useMarkStructuredRenderFailed(id);
    const clear = useClearStructuredRenderFailed(id);
    return createElement(
      "span",
      null,
      createElement("button", { className: "mark", onClick: () => mark() }),
      createElement("button", { className: "clear", onClick: () => clear() }),
    );
  }
  function Group() {
    const [response, update] = useQuestionResponse("group");
    const rows = response.sub_results ?? [];
    return createElement(
      "div",
      null,
      createElement("button", {
        className: "remove",
        onClick: () => update({ sub_results: rows.slice(1) }),
      }),
      createElement("button", {
        className: "edit",
        onClick: () => update({ values: [{ type: "string", value: "x" }] }),
      }),
      rows.map((_, rowIndex) =>
        createElement(ResponseRowProvider, {
          key: rowIndex,
          groupId: "group",
          rowIndex,
          children: createElement(Slot, { id: "child" }),
        }),
      ),
    );
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const click = (selector: string, index = 0) =>
    act(async () =>
      (
        container.querySelectorAll<HTMLButtonElement>(selector)[index] as
          HTMLButtonElement | undefined
      )?.click(),
    );
  const rowKey = (rowIndex: number) =>
    renderFailedKey("child", [{ questionId: "group", rowIndex }]);

  try {
    await act(async () => {
      root.render(
        createElement(
          Provider,
          { store },
          createElement(Slot, { id: "root" }),
          createElement(Group),
        ),
      );
    });
    await click(".mark", 0);
    await click(".mark", 2);
    assert.deepEqual(
      [...store.get(structuredRenderFailedAtom)].sort(),
      [renderFailedKey("root", []), rowKey(1)].sort(),
    );
    assert.deepEqual(validate(), [
      { question_id: "root", error: "structured_section_unavailable_required" },
      {
        question_id: "child",
        response_path: [{ questionId: "group", rowIndex: 1 }],
        error: "structured_section_unavailable_required",
      },
    ]);
    questionnaire.questions[0].required = false;
    questionnaire.questions[1].questions![0].required = false;
    assert.deepEqual(validate(), []);
    assert.deepEqual(await compose(), [
      {
        url: "/api/v1/patient/patient/",
        method: "PUT",
        reference_id: "structured:time_of_death:child#r0",
        body: { deceased_datetime: "2026-01-01T00:00:00Z" },
      },
    ]);
    await click(".clear", 1);
    assert.equal(store.get(structuredRenderFailedAtom).has(rowKey(1)), true);
    await click(".clear", 2);
    assert.equal(store.get(structuredRenderFailedAtom).has(rowKey(1)), false);
    assert.deepEqual(
      (await compose()).map(({ reference_id, body }) => ({
        reference_id,
        body,
      })),
      [
        {
          reference_id: "structured:time_of_death:child#r0",
          body: { deceased_datetime: "2026-01-01T00:00:00Z" },
        },
        {
          reference_id: "structured:time_of_death:child#r1",
          body: { deceased_datetime: "2026-01-02T00:00:00Z" },
        },
      ],
    );

    await click(".mark", 1);
    await click(".mark", 2);
    const before = store.get(structuredRenderFailedAtom);
    await click(".edit");
    assert.equal(store.get(structuredRenderFailedAtom), before);
    await click(".remove");
    assert.deepEqual(
      [...store.get(structuredRenderFailedAtom)],
      [renderFailedKey("root", [])],
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
