import assert from "node:assert/strict";
import { test } from "node:test";

import type { TFunction } from "i18next";
import { Provider, createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import {
  responsesAtom,
  useAnsweredQuestionIds,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { draftResponseHasContent } from "./draft/draftMerge";
import { collectActionReferenceErrors } from "./submit/validateActionReferences";
import { listFormsSummary } from "./useFillActions";

const questionnaire: QuestionnaireRead = {
  id: "form",
  slug: "form",
  title: "Coded answer",
  version: "1",
  status: "active",
  subject_type: "encounter",
  questions: [
    { id: "answer", link_id: "answer", text: "Answer", type: "choice" },
  ],
  actions: [{ condition: 'q_answer["code"] == "test"', instructions: [] }],
};
const t = ((key: string) => key) as TFunction;

function response(
  values: QuestionnaireResponse["values"],
): QuestionnaireResponse {
  return {
    question_id: "answer",
    link_id: "answer",
    structured_type: null,
    values,
  };
}

test("coding-only answers agree across drafts, action validation, agent summaries and outline completion", async () => {
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
  const root = createRoot(dom.window.document.getElementById("root")!);
  let completed = new Set<string>();
  function Harness() {
    completed = useAnsweredQuestionIds();
    return null;
  }
  try {
    await act(async () =>
      root.render(createElement(Provider, { store }, createElement(Harness))),
    );
    for (const [values, answered] of [
      [
        [
          {
            type: "string",
            value: "",
            coding: { code: "test", system: "test", display: "" },
          },
        ],
        true,
      ],
      [
        [
          {
            type: "quantity",
            coding: { code: "mg", system: "ucum", display: "mg" },
          },
        ],
        false,
      ],
      [[], false],
    ] as const) {
      const current = response([...values]);
      await act(async () => store.set(responsesAtom, { answer: current }));
      assert.equal(draftResponseHasContent(current), answered);
      assert.equal(
        collectActionReferenceErrors(questionnaire, { answer: current }, t)
          .length,
        answered ? 0 : 1,
      );
      const summary = listFormsSummary(
        [{ key: "form", isPrimary: true, questionnaire }],
        () => store,
      );
      assert.ok(summary.ok);
      assert.equal(
        (summary.data as { questions: { answered: boolean }[] }[])[0]
          .questions[0].answered,
        answered,
      );
      assert.equal(completed.has("answer"), answered);
    }
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test("action validation handles a restored response without its values array", () => {
  const malformed = { question_id: "answer" } as QuestionnaireResponse;
  assert.deepEqual(
    collectActionReferenceErrors(questionnaire, { answer: malformed }, t),
    [{ question_id: "answer", error: "action_reference_required" }],
  );
});
