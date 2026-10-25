import assert from "node:assert/strict";
import { test } from "node:test";

import type { Question } from "@/types/questionnaire/question";

import { storedGroupFields } from "./storedGroupFields";

test("saved group fields restore ordinary typed answers without inventing defaults", () => {
  const question = (id: string, type: Question["type"]): Question => ({
    id,
    link_id: `group__${id}`,
    type,
    text: id,
  });
  const boolean = question("boolean", "boolean");
  const number = question("number", "integer");
  const date = question("date", "dateTime");
  const choice = {
    ...question("choice", "choice"),
    repeats: true,
    answer_option: [{ value: "default", initial_selected: true }],
  };
  const fields = storedGroupFields(
    { boolean, number, date, choice, missing: null },
    [
      {
        question_id: boolean.id,
        values: [{ value: "false" }, { value: false }],
      },
      {
        question_id: number.id,
        values: [{ value: "0" }, { value: "12" }, { value: "" }],
      },
      { question_id: date.id, values: [{ value: "2026-09-26T12:00:00Z" }] },
    ],
  );
  assert.deepEqual(
    fields.boolean?.response.values.map((entry) => entry.value),
    [false, false],
  );
  assert.deepEqual(
    fields.number?.response.values.map((entry) => entry.value),
    [0, 12, undefined],
  );
  assert.deepEqual(
    fields.date?.response.values[0]?.value,
    new Date("2026-09-26T12:00:00Z"),
  );
  assert.deepEqual(fields.choice?.response.values, []);
  assert.equal(fields.missing, null);
  assert.equal(fields.boolean?.disabled, true);
  assert.equal(fields.boolean?.response.structured_type, null);

  const repeated = storedGroupFields({ choice }, [
    {
      question_id: choice.id,
      values: [
        { value: "first" },
        { coding: { system: "test", code: "second", display: "Second" } },
      ],
      note: "Saved note",
    },
  ]);
  assert.equal(repeated.choice?.question, choice);
  assert.equal(repeated.choice?.response.values.length, 2);
  assert.equal(repeated.choice?.response.values[1].coding?.code, "second");
  assert.equal(repeated.choice?.response.note, "Saved note");
});

test("date-only answers restore as local calendar days", () => {
  const date: Question = { id: "d", link_id: "d", text: "Date", type: "date" };
  const fields = storedGroupFields({ date }, [
    { question_id: "d", values: [{ value: "2026-09-26" }] },
  ]);
  assert.deepEqual(
    fields.date?.response.values[0]?.value,
    new Date(2026, 8, 26),
  );
});
