import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractQuestions,
  parseQuestionnaireImport,
} from "./questionnaireImport";

const exported = {
  id: "source-questionnaire",
  title: "Clinical review",
  slug: "clinical-review",
  description: "Review symptoms",
  version: 1,
  subject_type: "encounter",
  status: "active",
  auth_context: "facility",
  facility: "source-facility",
  created_by: { username: "author" },
  code: null,
  questions: [
    { id: "source-question", link_id: "score", text: "Score", type: "integer" },
  ],
  actions: [
    {
      condition: "q_score > 5",
      instructions: [
        {
          slug: "show_message",
          params: { message: "Review score" },
          context: "self",
        },
      ],
    },
  ],
};

describe("questionnaire definition import", () => {
  it("rejects answer options that are not an array of valued options", () => {
    const choice = { text: "Choice", type: "choice", link_id: "c" };
    assert.equal(
      extractQuestions({ questions: [{ ...choice, answer_option: "bad" }] }),
      null,
    );
    assert.equal(
      extractQuestions({ questions: [{ ...choice, answer_option: [{}] }] }),
      null,
    );
    assert.equal(
      extractQuestions({
        questions: [{ ...choice, answer_option: [{ value: "a" }] }],
      })?.length,
      1,
    );
  });

  it("normalizes legacy value-set slugs at every question depth without changing the source", () => {
    const binding = { slug: "current-options", external_id: "current-id" };
    const legacy = {
      questions: [
        {
          text: "Group",
          type: "group",
          questions: [
            {
              text: "Legacy",
              type: "choice",
              answer_value_set: "legacy-options",
            },
            { text: "Current", type: "choice", answer_value_set: binding },
          ],
        },
      ],
    };
    const questions = extractQuestions(legacy);
    assert.deepEqual(questions?.[0].questions?.[0].answer_value_set, {
      slug: "legacy-options",
    });
    assert.deepEqual(questions?.[0].questions?.[1].answer_value_set, binding);
    assert.equal(
      legacy.questions[0].questions[0].answer_value_set,
      "legacy-options",
    );
  });

  it("keeps the writable definition and excludes source identity, scope and audit metadata", () => {
    const parsed = parseQuestionnaireImport(exported);
    assert.ok(parsed);
    assert.equal(parsed.slug, exported.slug);
    assert.equal(parsed.subject_type, "encounter");
    assert.deepEqual(parsed.actions, exported.actions);
    for (const field of [
      "id",
      "status",
      "auth_context",
      "facility",
      "created_by",
    ]) {
      assert.equal(field in parsed, false);
    }
  });

  it("allows correcting an invalid imported slug in the confirmation form", () => {
    assert.equal(
      parseQuestionnaireImport({ ...exported, slug: "old slug!" })?.slug,
      "old slug!",
    );
  });

  it("imports empty full drafts and lets legacy null slugs be corrected", () => {
    const parsed = parseQuestionnaireImport({
      ...exported,
      slug: null,
      questions: [],
    });
    assert.ok(parsed);
    assert.equal(parsed.slug, "");
    assert.deepEqual(parsed.questions, []);
    assert.equal(extractQuestions({ questions: [] }), null);
  });

  it("rejects malformed subjects, actions and nested questions before import", () => {
    assert.equal(
      parseQuestionnaireImport({ ...exported, subject_type: "unknown" }),
      null,
    );
    assert.equal(
      parseQuestionnaireImport({
        ...exported,
        actions: [{ condition: "True", instructions: [null] }],
      }),
      null,
    );
    for (const slug of [null, undefined, ""]) {
      assert.equal(
        parseQuestionnaireImport({
          ...exported,
          actions: [
            { condition: "True", instructions: [{ slug, params: {} }] },
          ],
        }),
        null,
      );
    }
    assert.equal(
      parseQuestionnaireImport({
        ...exported,
        questions: [
          {
            text: "Group",
            type: "group",
            questions: [{ text: "Bad child", type: "unknown" }],
          },
        ],
      }),
      null,
    );
  });

  it("rejects malformed condition references before regenerating question IDs", () => {
    for (const enable_when of [
      { question: "score" },
      [null],
      ["score"],
      [{}],
      [{ question: 123 }],
      [{ question: "score", answer: 5 }],
    ]) {
      assert.equal(
        parseQuestionnaireImport({
          ...exported,
          questions: [{ ...exported.questions[0], enable_when }],
        }),
        null,
      );
    }
    for (const enable_when of [
      undefined,
      null,
      [],
      [{ question: "score", operator: "greater", answer: 5 }],
    ]) {
      assert.ok(
        parseQuestionnaireImport({
          ...exported,
          questions: [{ ...exported.questions[0], enable_when }],
        }),
      );
    }
  });

  it("rejects malformed answer options and descriptions", () => {
    for (const answer_option of [
      "Yes,No",
      [{}],
      [null],
      [{ value: null }],
      [{ value: Number.NaN }],
      [{ value: Number.POSITIVE_INFINITY }],
      [{ value: "yes", initial_selected: "false" }],
      [{ value: "yes", initial_selected: 1 }],
      [{ value: "yes", initial_selected: null }],
    ]) {
      assert.equal(
        parseQuestionnaireImport({
          ...exported,
          questions: [{ ...exported.questions[0], answer_option }],
        }),
        null,
      );
    }
    for (const answer_option of [
      undefined,
      null,
      [],
      [{ value: "yes", display: "Yes", initial_selected: false }, { value: 1 }],
    ]) {
      assert.ok(
        parseQuestionnaireImport({
          ...exported,
          questions: [{ ...exported.questions[0], answer_option }],
        }),
      );
    }
    assert.equal(
      parseQuestionnaireImport({
        ...exported,
        questions: [{ ...exported.questions[0], description: ["Help"] }],
      }),
      null,
    );
  });

  it("normalizes numeric choice values at every depth before they reach the renderer or save payload", () => {
    const options = [
      { value: 0, initial_selected: true },
      { value: 1.5, initial_selected: false },
      { value: "2" },
    ];
    const imported = {
      ...exported,
      questions: [
        {
          text: "Group",
          type: "group",
          questions: [
            { text: "Score", type: "choice", answer_option: options },
          ],
        },
        { text: "Score", type: "choice", answer_option: options },
      ],
    };
    const parsed = parseQuestionnaireImport(imported);
    assert.ok(parsed);
    const normalized = [
      { value: "0", initial_selected: true },
      { value: "1.5", initial_selected: false },
      { value: "2" },
    ];
    assert.deepEqual(
      parsed.questions[0].questions?.[0].answer_option,
      normalized,
    );
    assert.deepEqual(parsed.questions[1].answer_option, normalized);
    assert.equal(options[0].value, 0);
  });

  it("retains support for question-only files without treating them as full definitions", () => {
    const file = { questions: exported.questions };
    assert.deepEqual(extractQuestions(file), exported.questions);
    assert.equal(parseQuestionnaireImport(file), null);
  });
});
