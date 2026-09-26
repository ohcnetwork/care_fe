import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

import { evaluateEnableWhen } from "./store";

function response(values: ResponseValue[]): QuestionnaireResponse {
  return {
    question_id: "source",
    link_id: "source",
    structured_type: null,
    values,
  };
}

test("boolean equals and not_equals compare both boolean and legacy string answers consistently", () => {
  for (const value of [true, false, "Yes", "No"] as const) {
    for (const answer of [true, false, "Yes", "No"] as const) {
      const source = response([
        typeof value === "boolean"
          ? { type: "boolean", value }
          : { type: "string", value },
      ]);
      const matches =
        (value === true || value === "Yes") ===
        (answer === true || answer === "Yes");
      for (const operator of ["equals", "not_equals"] as const) {
        assert.equal(
          evaluateEnableWhen({ question: "source", operator, answer }, source),
          operator === "equals" ? matches : !matches,
          `${String(value)} ${operator} ${String(answer)}`,
        );
      }
    }
  }
});

test("an unanswered boolean cannot satisfy either comparison", () => {
  for (const source of [undefined, response([])]) {
    for (const operator of ["equals", "not_equals"] as const) {
      assert.equal(
        evaluateEnableWhen(
          { question: "source", operator, answer: false },
          source,
        ),
        false,
      );
    }
  }
});

test("boolean comparisons consider answers after the first entry", () => {
  const source = response([
    { type: "boolean", value: false },
    { type: "boolean", value: true },
  ]);
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "equals", answer: true },
      source,
    ),
    true,
  );
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "not_equals", answer: true },
      source,
    ),
    false,
  );
});

test("exists distinguishes a recorded false answer from no answer", () => {
  const source = response([{ type: "boolean", value: false }]);
  for (const answer of [true, false]) {
    assert.equal(
      evaluateEnableWhen(
        { question: "source", operator: "exists", answer },
        source,
      ),
      answer,
    );
    assert.equal(
      evaluateEnableWhen(
        { question: "source", operator: "exists", answer },
        response([]),
      ),
      !answer,
    );
  }
});
