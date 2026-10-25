import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { before, test } from "node:test";

import type { TFunction } from "i18next";

import { initializeResponses } from "@/components/QuestionnaireV2/form/engine/store";
import {
  registerQuestionGroup,
  type RegisteredGroupDefinition,
} from "@/components/QuestionnaireV2/groups/registry";
import { instantiateGroupQuestions } from "@/components/QuestionnaireV2/groups/schema";
import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

let collectQuestionErrors: typeof import("./validation").collectQuestionErrors;
before(async () => {
  // Keep browser-only structured widgets out of Node; group validation is real.
  const require = createRequire(import.meta.url);
  const path =
    require.resolve("@/components/QuestionnaireV2/structured/registry");
  const previous = require.cache[path];
  const registry = new Module(path);
  registry.exports = {
    resolveStructuredSlotState: () => {
      throw new Error("Unexpected structured question");
    },
  };
  registry.loaded = true;
  require.cache[path] = registry;
  try {
    ({ collectQuestionErrors } = await import("./validation"));
  } finally {
    if (previous) require.cache[path] = previous;
    else delete require.cache[path];
  }
});

const definition: RegisteredGroupDefinition = {
  type: "validation_test.chart",
  label: "Chart",
  subjects: ["patient"],
  schema: [{ link_id: "axis", text: "Axis", type: "integer", required: true }],
  builder: () => null,
  component: () => null,
};
function group(repeats = false): Question {
  const question: Question = {
    id: "chart",
    link_id: "chart",
    text: "Chart",
    type: "group",
    structured_type: definition.type,
    repeats,
  };
  question.questions = instantiateGroupQuestions(question, definition.schema);
  return question;
}
function validate(
  questions: Question[],
  responses = initializeResponses(questions),
) {
  const questionnaire: QuestionnaireRead = {
    id: "form",
    slug: "form",
    title: "Form",
    status: "active",
    subject_type: "patient",
    questions,
  };
  return collectQuestionErrors(
    questions,
    responses,
    ((key: string) => key) as TFunction,
    {
      questionnaire,
      subject: {},
      renderFailed: new Set(),
    },
  );
}

test("group callback returns ordinary errors and preserves standard child validation", (t) => {
  const question = group();
  const responses = initializeResponses([question]);
  const callback = t.mock.fn(
    (
      saved: Question,
      scope: Record<string, QuestionnaireResponse>,
      path: ResponsePath,
    ) => {
      assert.equal(saved, question);
      assert.equal(scope, responses);
      return [
        {
          question_id: saved.questions![0].id,
          response_path: path,
          error: "Axis is invalid",
        },
        { question_id: saved.id, msg: "Check chart" },
      ];
    },
  );
  t.after(
    registerQuestionGroup(
      { ...definition, validate: callback },
      "validation_test",
    ),
  );
  assert.deepEqual(validate([question], responses), [
    {
      question_id: question.questions![0].id,
      response_path: [],
      error: "Axis is invalid",
    },
    { question_id: question.id, msg: "Check chart" },
    { question_id: question.questions![0].id, error: "field_required" },
  ]);
  assert.equal(callback.mock.callCount(), 1);
});

test("repeating callback receives all rows once and preserves enclosing row paths", (t) => {
  const question = group(true);
  const outer: Question = {
    id: "outer",
    link_id: "outer",
    text: "Outer",
    type: "group",
    repeats: true,
    questions: [question],
  };
  const responses = initializeResponses([outer]);
  const inner = initializeResponses([question]);
  inner.chart.sub_results = [0, 200].map((value) => {
    const row = Object.values(initializeResponses(question.questions!));
    row[0].values = [{ type: "number", value }];
    return row;
  });
  responses.outer.sub_results = [Object.values(inner)];
  const callback = t.mock.fn(
    (
      saved: Question,
      scope: Record<string, QuestionnaireResponse>,
      path: ResponsePath,
    ) => {
      const rows = scope[saved.id].sub_results!;
      assert.equal(rows, inner.chart.sub_results);
      assert.deepEqual(
        rows.map((row) => row[0].values[0].value),
        [0, 200],
      );
      assert.deepEqual(path, [{ questionId: "outer", rowIndex: 0 }]);
      return [
        {
          question_id: rows[1][0].question_id,
          response_path: [...path, { questionId: saved.id, rowIndex: 1 }],
          error: "Axis is out of range",
        },
      ];
    },
  );
  t.after(
    registerQuestionGroup(
      { ...definition, repeats: true, validate: callback },
      "validation_test",
    ),
  );
  assert.deepEqual(validate([outer], responses), [
    {
      question_id: question.questions![0].id,
      response_path: [
        { questionId: "outer", rowIndex: 0 },
        { questionId: "chart", rowIndex: 1 },
      ],
      error: "Axis is out of range",
    },
  ]);
  assert.equal(callback.mock.callCount(), 1);
});

test("callbacks are optional and empty required groups retain standard validation", (t) => {
  const question = group(true);
  question.required = true;
  t.after(
    registerQuestionGroup({ ...definition, repeats: true }, "validation_test"),
  );
  assert.deepEqual(validate([question]), [
    { question_id: "chart", response_path: [], error: "field_required" },
  ]);
});

test("disabled and incompatible groups do not invoke the plugin", (t) => {
  const callback = t.mock.fn(() => []);
  t.after(
    registerQuestionGroup(
      { ...definition, validate: callback },
      "validation_test",
    ),
  );
  const question = group();
  question.enable_when = [
    { question: "enabled", operator: "equals", answer: true },
  ];
  const toggle: Question = {
    id: "enabled",
    link_id: "enabled",
    text: "Enabled",
    type: "boolean",
  };
  assert.deepEqual(validate([toggle, question]), []);
  delete question.enable_when;
  question.questions![0].type = "string";
  assert.equal(
    validate([question])[0].error,
    "registered_group_schema_update_required",
  );
  assert.equal(callback.mock.callCount(), 0);
});

test("older forms pass their saved schema to the callback unchanged", (t) => {
  const question = group();
  question.questions![0].required = false;
  const callback = t.mock.fn((saved: Question) => {
    assert.equal(saved, question);
    assert.equal(saved.questions!.length, 1);
    return [];
  });
  t.after(
    registerQuestionGroup(
      {
        ...definition,
        schema: [
          ...definition.schema,
          { link_id: "note", text: "Note", type: "string" },
        ],
        validate: callback,
      },
      "validation_test",
    ),
  );
  assert.deepEqual(validate([question]), []);
  assert.equal(callback.mock.callCount(), 1);
});

test("callback failures block submission without skipping child validation", (t) => {
  const question = group();
  t.after(
    registerQuestionGroup(
      {
        ...definition,
        validate: () => {
          throw new Error("Plugin failed");
        },
      },
      "validation_test",
    ),
  );
  assert.deepEqual(validate([question]), [
    {
      question_id: "chart",
      response_path: [],
      error: "registered_group_validation_failed",
    },
    { question_id: question.questions![0].id, error: "field_required" },
  ]);
});
