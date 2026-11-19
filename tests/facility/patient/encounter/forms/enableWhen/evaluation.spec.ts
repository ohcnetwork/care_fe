import { expect, test } from "@playwright/test";

import { findInvalidQuestions } from "../../../../../../src/components/QuestionnaireV2/builder/saveValidation";
import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "../../../../../../src/components/QuestionnaireV2/form/engine/store";
import { circularConditionQuestionIds } from "../../../../../../src/components/QuestionnaireV2/shared/circularConditions";
import type { QuestionnaireResponse } from "../../../../../../src/types/questionnaire/form";
import type { Question } from "../../../../../../src/types/questionnaire/question";

function booleanQuestion(id: string, controllers: string[] = []): Question {
  return {
    id,
    link_id: id,
    text: id,
    type: "boolean",
    enable_when: controllers.map((question) => ({
      question,
      operator: "equals",
      answer: true,
    })),
  };
}

function answered(
  questions: Question[],
): Record<string, QuestionnaireResponse> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        question_id: question.id,
        link_id: question.link_id,
        structured_type: null,
        values: [{ type: "boolean", value: true }],
      },
    ]),
  );
}

test("overlapping conditional dependencies evaluate each controller only once per pass", () => {
  let conditionReads = 0;
  const questions = Array.from({ length: 30 }, (_, index) => {
    const question = booleanQuestion(
      `${index}`,
      [index - 1, index - 2].filter((value) => value >= 0).map(String),
    );
    const conditions = question.enable_when;
    return {
      ...question,
      get enable_when() {
        conditionReads++;
        return conditions;
      },
    };
  });
  const responses = answered(questions);
  const links = buildLinkIndex(questions);
  conditionReads = 0;

  expect(isQuestionEnabledInState(questions[29], responses, links)).toBe(true);
  expect(conditionReads).toBeLessThanOrEqual(questions.length * 2);

  responses["0"].values = [{ type: "boolean", value: false }];
  expect(isQuestionEnabledInState(questions[29], responses, links)).toBe(false);
  responses["0"].values = [{ type: "boolean", value: true }];
  expect(isQuestionEnabledInState(questions[29], responses, links)).toBe(true);
});

test("circular questions are disabled and cannot be saved", () => {
  const a = booleanQuestion("a", ["b"]);
  const b = booleanQuestion("b", ["a"]);
  b.enable_when = [{ question: "a", operator: "exists", answer: false }];
  const dependent = booleanQuestion("dependent", ["a", "b"]);
  const questions = [a, b, dependent];
  const responses = answered(questions);
  const links = buildLinkIndex(questions);

  expect(isQuestionEnabledInState(a, responses, links)).toBe(false);
  expect(isQuestionEnabledInState(b, responses, links)).toBe(false);
  expect(isQuestionEnabledInState(dependent, responses, links)).toBe(false);
  expect(
    findInvalidQuestions(questions).map(({ question, messageKey }) => ({
      id: question.id,
      messageKey,
    })),
  ).toEqual([
    { id: "a", messageKey: "questionnaire_circular_conditions" },
    { id: "b", messageKey: "questionnaire_circular_conditions" },
  ]);
});

test("overlapping dependencies reaching cycles have bounded evaluation", () => {
  let conditionReads = 0;
  const questions = Array.from({ length: 30 }, (_, index) => {
    const controllers =
      index === 0 ? [1] : index === 1 ? [0] : [index - 1, index - 2];
    const question = booleanQuestion(`${index}`, controllers.map(String));
    const conditions = question.enable_when;
    return {
      ...question,
      get enable_when() {
        conditionReads++;
        return conditions;
      },
    };
  });
  const responses = answered(questions);
  const links = buildLinkIndex(questions);
  conditionReads = 0;
  expect(isQuestionEnabledInState(questions[29], responses, links)).toBe(false);
  expect(conditionReads).toBeLessThanOrEqual(questions.length * 2);
});

test("group conditions cannot depend on their own descendants", () => {
  const child = booleanQuestion("child");
  const group: Question = {
    ...booleanQuestion("group", ["child"]),
    type: "group",
    questions: [child],
  };
  expect(circularConditionQuestionIds([group])).toEqual(
    new Set(["group", "child"]),
  );
  expect(findInvalidQuestions([group])).toHaveLength(2);
  const self = booleanQuestion("self", ["self"]);
  expect(circularConditionQuestionIds([self])).toEqual(new Set(["self"]));
});

test("a large cyclic component is detected without enumerating its paths", () => {
  const questions = Array.from({ length: 30 }, (_, index) =>
    booleanQuestion(`${index}`, [`${(index + 1) % 30}`, `${(index + 2) % 30}`]),
  );
  expect(circularConditionQuestionIds(questions)).toEqual(
    new Set(questions.map((question) => question.id)),
  );
  const responses = answered(questions);
  const links = buildLinkIndex(questions);
  for (const question of questions) {
    expect(isQuestionEnabledInState(question, responses, links)).toBe(false);
  }
});

test("disabled ancestors still make controller answers unavailable", () => {
  const gate = booleanQuestion("gate");
  const controller = booleanQuestion("controller");
  const group: Question = {
    ...booleanQuestion("group", ["gate"]),
    type: "group",
    questions: [controller],
  };
  const dependent = booleanQuestion("dependent", ["controller"]);
  const questions = [gate, group, dependent];
  const responses = answered([...questions, controller]);
  const links = buildLinkIndex(questions);

  responses.gate.values = [{ type: "boolean", value: false }];
  expect(isQuestionEnabledInState(dependent, responses, links)).toBe(false);
  responses.gate.values = [{ type: "boolean", value: true }];
  expect(isQuestionEnabledInState(dependent, responses, links)).toBe(true);
});
