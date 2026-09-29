import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

import type { EnableWhen, Question } from "@/types/questionnaire/question";

import { evaluateEnableWhen, isQuestionEnabledInState } from "./store";

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

test("placeholder entries do not count as answers for any operator", () => {
  const placeholder = response([{ type: "string", value: "" }]);
  const cases: [EnableWhen, boolean][] = [
    [{ question: "source", operator: "exists", answer: true }, false],
    [{ question: "source", operator: "exists", answer: false }, true],
    [{ question: "source", operator: "equals", answer: "" }, false],
    [{ question: "source", operator: "not_equals", answer: "x" }, false],
    [{ question: "source", operator: "less", answer: 1 }, false],
    [{ question: "source", operator: "less_or_equals", answer: 0 }, false],
    [{ question: "source", operator: "greater_or_equals", answer: 0 }, false],
    [{ question: "source", operator: "greater", answer: -1 }, false],
  ];
  for (const [condition, expected] of cases) {
    assert.equal(
      evaluateEnableWhen(condition, placeholder),
      expected,
      `${condition.operator} ${String(condition.answer)}`,
    );
  }
  const mixed = response([
    { type: "string", value: "" },
    { type: "string", value: "5" },
  ]);
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "less", answer: 1 },
      mixed,
    ),
    false,
  );
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "greater", answer: 1 },
      mixed,
    ),
    true,
  );
});

test("a coding-only entry exists", () => {
  const codingOnly = response([
    {
      type: "string",
      value: undefined,
      coding: { code: "1", system: "s", display: "One" },
    },
  ]);
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "exists", answer: true },
      codingOnly,
    ),
    true,
  );
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "exists", answer: false },
      codingOnly,
    ),
    false,
  );
});

test("equals and not_equals fold boolean strings on both sides", () => {
  const recordedTrue = response([{ type: "boolean", value: true }]);
  for (const answer of ["true", "TRUE", " yes ", "1", "on"]) {
    assert.equal(
      evaluateEnableWhen(
        { question: "source", operator: "equals", answer },
        recordedTrue,
      ),
      true,
      answer,
    );
    assert.equal(
      evaluateEnableWhen(
        { question: "source", operator: "not_equals", answer },
        recordedTrue,
      ),
      false,
      answer,
    );
  }
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "equals", answer: "No" },
      response([{ type: "string", value: "false" }]),
    ),
    true,
  );
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "equals", answer: "1" },
      response([{ type: "number", value: 1 }]),
    ),
    true,
  );
  assert.equal(
    evaluateEnableWhen(
      { question: "source", operator: "greater", answer: 0 },
      response([{ type: "string", value: "yes" }]),
    ),
    false,
  );
});

test("a condition on an unknown link_id disables the question", () => {
  const question: Question = {
    id: "dependent",
    link_id: "dependent",
    text: "Dependent",
    type: "string",
    enable_when: [{ question: "missing", operator: "exists", answer: false }],
  };
  assert.equal(isQuestionEnabledInState(question, {}, {}), false);
  assert.equal(
    isQuestionEnabledInState(
      { ...question, enable_behavior: "any" },
      {},
      { missing: "" },
    ),
    true,
  );
});
