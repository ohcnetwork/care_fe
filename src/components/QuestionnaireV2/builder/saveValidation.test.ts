import assert from "node:assert/strict";
import { test } from "node:test";

import type { Question } from "@/types/questionnaire/question";

import { builderReducer, type BuilderAction } from "./builderReducer";
import { findInvalidQuestions } from "./saveValidation";

test("deleting a visibility target blocks saving until the condition is repaired", () => {
  const target: Question = {
    id: "target",
    link_id: "target",
    text: "Target",
    type: "string",
  };
  const dependent: Question = {
    id: "dependent",
    link_id: "dependent",
    text: "Dependent",
    type: "string",
    enable_when: [{ question: "target", operator: "equals", answer: "yes" }],
  };
  assert.deepEqual(findInvalidQuestions([target, dependent]), []);
  assert.deepEqual(findInvalidQuestions([dependent]), [
    { question: dependent, messageKey: "condition_target_missing" },
  ]);
  assert.deepEqual(
    findInvalidQuestions([
      {
        id: "group",
        link_id: "group",
        text: "Group",
        type: "group",
        questions: [target],
      },
      dependent,
    ]),
    [],
  );
});

test("structured questions need a registered type before they can be saved", () => {
  const question: Question = {
    id: "structured-question",
    link_id: "structured-question",
    text: "Structured question",
    type: "structured",
  };
  assert.equal(
    findInvalidQuestions([question])[0]?.messageKey,
    "structured_type_unknown",
  );
  assert.equal(
    findInvalidQuestions([
      { ...question, structured_type: "missing_plugin.question" },
    ])[0]?.messageKey,
    "structured_type_unknown",
  );
  assert.deepEqual(
    findInvalidQuestions([{ ...question, structured_type: "diagnosis" }]),
    [],
  );
  assert.deepEqual(findInvalidQuestions([{ ...question, type: "string" }]), []);
});

test("registered groups preserve their saved schema when the plug is unavailable", () => {
  const question: Question = {
    id: "plugin-question",
    link_id: "plugin-question",
    text: "Plugin question",
    type: "group",
    structured_type: "save_validation.question",
    questions: [
      {
        id: "child",
        link_id: "plugin-question__child",
        text: "Child",
        type: "string",
      },
    ],
  };
  assert.deepEqual(findInvalidQuestions([question]), []);
  assert.deepEqual(
    findInvalidQuestions([
      { ...question, structured_type: null } as unknown as Question,
    ]),
    [],
  );
  assert.equal(
    findInvalidQuestions([{ ...question, structured_type: "diagnosis" }])[0]
      ?.messageKey,
    "registered_group_type_invalid",
  );
  assert.equal(
    findInvalidQuestions([{ ...question, questions: [] }])[0]?.messageKey,
    "group_needs_subquestion",
  );
});

test("schema repair and deletion block dangling visibility targets without removing the conditions", () => {
  const target: Question = {
    id: "target",
    link_id: "registered__target",
    text: "Target",
    type: "string",
  };
  const retained = {
    ...target,
    id: "retained",
    link_id: "registered__retained",
  };
  const group: Question = {
    id: "registered",
    link_id: "registered",
    text: "Registered group",
    type: "group",
    structured_type: "save_validation.question",
    questions: [target, retained],
  };
  const dependent: Question = {
    id: "dependent",
    link_id: "dependent",
    text: "Dependent",
    type: "string",
    enable_when: [
      { question: target.link_id, operator: "equals", answer: "yes" },
    ],
  };
  const initial = {
    questions: [group, dependent],
    actions: [],
    selectedId: group.id,
    dirty: false,
  };
  assert.deepEqual(findInvalidQuestions(initial.questions), []);
  const changes: BuilderAction[] = [
    { type: "updateQuestion", id: group.id, patch: { questions: [retained] } },
    { type: "removeQuestions", ids: [group.id] },
  ];
  for (const change of changes) {
    const { questions } = builderReducer(initial, change);
    assert.deepEqual(findInvalidQuestions(questions), [
      { question: dependent, messageKey: "condition_target_missing" },
    ]);
    assert.deepEqual(
      questions.find(({ id }) => id === dependent.id)?.enable_when,
      dependent.enable_when,
    );
  }
});
