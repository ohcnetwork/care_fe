import assert from "node:assert/strict";
import { test } from "node:test";

import { createStore } from "jotai";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { Question } from "@/types/questionnaire/question";

import type { FillFormEntry } from "./formSession";
import { applySetResponse } from "./useFillActions";

const questions: Question[] = [
  {
    id: "medications",
    link_id: "medications",
    text: "Medications",
    type: "group",
    repeats: true,
    questions: [
      { id: "dose", link_id: "dose", text: "Dose", type: "string" },
      {
        id: "route",
        link_id: "route",
        text: "Route",
        type: "string",
        enable_when: [{ question: "dose", operator: "exists", answer: true }],
      },
    ],
  },
];

const forms: FillFormEntry[] = [
  {
    key: "form",
    isPrimary: true,
    questionnaire: {
      id: "form",
      slug: "form",
      title: "Medication chart",
      version: "1",
      status: "active",
      subject_type: "encounter",
      questions,
    },
  },
];

test("writes inside repeating groups land in the addressed row", async () => {
  const store = createStore();
  store.set(responsesAtom, initializeResponses(questions));
  const set = (input: Parameters<typeof applySetResponse>[0]) =>
    applySetResponse(input, forms, () => store);
  const rowValues = (rowIndex: number, questionId: string) =>
    store
      .get(responsesAtom)
      .medications.sub_results?.[rowIndex]?.find(
        (response) => response.question_id === questionId,
      )?.values;

  assert.deepEqual(await set({ link_id: "dose", values: ["5 mg"] }), {
    ok: true,
  });
  assert.deepEqual(rowValues(0, "dose"), [{ type: "string", value: "5 mg" }]);

  assert.deepEqual(
    await set({ link_id: "dose", row_index: 1, values: ["10 mg"] }),
    { ok: true },
  );
  assert.deepEqual(rowValues(1, "dose"), [{ type: "string", value: "10 mg" }]);
  assert.deepEqual(rowValues(0, "dose"), [{ type: "string", value: "5 mg" }]);

  const missing = await set({ link_id: "dose", row_index: 3, values: ["x"] });
  assert.equal(missing.ok, false);
  assert.match(missing.ok ? "" : missing.error, /has 2 rows/);
});

test("enable_when inside a row is judged against that row's answers", async () => {
  const store = createStore();
  store.set(responsesAtom, initializeResponses(questions));
  const set = (input: Parameters<typeof applySetResponse>[0]) =>
    applySetResponse(input, forms, () => store);

  const disabled = await set({ link_id: "route", values: ["oral"] });
  assert.equal(disabled.ok, false);

  assert.deepEqual(await set({ link_id: "dose", values: ["5 mg"] }), {
    ok: true,
  });
  assert.deepEqual(await set({ link_id: "route", values: ["oral"] }), {
    ok: true,
  });
});
