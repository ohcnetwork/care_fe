import assert from "node:assert/strict";
import { test } from "node:test";

import { registerPluginStructuredType } from "@/components/QuestionnaireV2/structured/pluginRegistry";

import type { Question } from "@/types/questionnaire/question";

import { findInvalidQuestions } from "./saveValidation";

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

test("plugin structured questions are valid only while their type is registered", () => {
  const question: Question = {
    id: "plugin-question",
    link_id: "plugin-question",
    text: "Plugin question",
    type: "structured",
    structured_type: "save_validation.question",
  };
  const unregister = registerPluginStructuredType(
    {
      type: question.structured_type!,
      component: () => null,
      requires: [],
      subjects: ["encounter"],
      draftPolicy: "serialize",
      label: "Plugin question",
      persistence: "response",
    },
    "save_validation",
  );
  try {
    assert.deepEqual(findInvalidQuestions([question]), []);
  } finally {
    unregister();
  }
  assert.equal(
    findInvalidQuestions([question])[0]?.messageKey,
    "structured_type_unknown",
  );
});
