import assert from "node:assert/strict";
import { test } from "node:test";

import { createStore } from "jotai";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import type { FillFormEntry } from "./formSession";
import { applySetResponse, listFormsSummary } from "./useFillActions";

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
      {
        id: "times",
        link_id: "times",
        text: "Times",
        type: "group",
        repeats: true,
        questions: [{ id: "at", link_id: "at", text: "At", type: "string" }],
      },
    ],
  },
];

function session() {
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
  const store = createStore();
  store.set(responsesAtom, initializeResponses(questions));
  const rowOf = (path: number[]) =>
    path.reduce<QuestionnaireResponse[] | undefined>(
      (row, index, depth) =>
        (row ?? []).find(
          (entry) => entry.question_id === ["medications", "times"][depth],
        )?.sub_results?.[index],
      [store.get(responsesAtom).medications],
    );
  return {
    set: (input: Parameters<typeof applySetResponse>[0]) =>
      applySetResponse(input, forms, () => store),
    values: (path: number[], questionId: string) =>
      rowOf(path)?.find((entry) => entry.question_id === questionId)?.values,
    summary: () => {
      const result = listFormsSummary(forms, () => store);
      assert.ok(result.ok);
      return (result.data as { questions: Record<string, unknown>[] }[])[0]
        .questions;
    },
  };
}

test("writes inside repeating groups land in the addressed row", async () => {
  const { set, values } = session();

  assert.deepEqual(await set({ link_id: "dose", values: ["5 mg"] }), {
    ok: true,
  });
  assert.deepEqual(values([0], "dose"), [{ type: "string", value: "5 mg" }]);

  assert.deepEqual(
    await set({ link_id: "dose", row_path: [1], values: ["10 mg"] }),
    { ok: true },
  );
  assert.deepEqual(values([1], "dose"), [{ type: "string", value: "10 mg" }]);
  assert.deepEqual(values([0], "dose"), [{ type: "string", value: "5 mg" }]);

  const missing = await set({ link_id: "dose", row_path: [3], values: ["x"] });
  assert.equal(missing.ok, false);
  assert.match(missing.ok ? "" : missing.error, /has 2 rows/);

  const tooDeep = await set({
    link_id: "dose",
    row_path: [0, 0],
    values: ["x"],
  });
  assert.equal(tooDeep.ok, false);
});

test("nested repeating groups take one index per level", async () => {
  const { set, values, summary } = session();

  assert.deepEqual(await set({ link_id: "dose", values: ["5 mg"] }), {
    ok: true,
  });
  assert.deepEqual(
    await set({ link_id: "at", row_path: [1, 0], values: ["08:00"] }),
    { ok: true },
  );
  assert.deepEqual(
    await set({ link_id: "at", row_path: [1, 1], values: ["20:00"] }),
    { ok: true },
  );
  assert.deepEqual(values([1, 0], "at"), [{ type: "string", value: "08:00" }]);
  assert.deepEqual(values([1, 1], "at"), [{ type: "string", value: "20:00" }]);
  assert.equal(values([0, 0], "at"), undefined);

  const rows = summary()
    .filter((question) => question.link_id === "at")
    .map((question) => [question.row_path, question.values]);
  assert.deepEqual(rows, [
    [[0, 0], []],
    [[1, 0], ["08:00"]],
    [[1, 1], ["20:00"]],
  ]);
});

test("enable_when inside a row is judged against that row's answers", async () => {
  const { set } = session();

  const disabled = await set({ link_id: "route", values: ["oral"] });
  assert.equal(disabled.ok, false);

  assert.deepEqual(await set({ link_id: "dose", values: ["5 mg"] }), {
    ok: true,
  });
  assert.deepEqual(await set({ link_id: "route", values: ["oral"] }), {
    ok: true,
  });
});
