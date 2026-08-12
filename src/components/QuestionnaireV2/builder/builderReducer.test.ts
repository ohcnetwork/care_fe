import type { TFunction } from "i18next";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  plainWordsSummary,
  questionsByLinkId,
} from "@/components/QuestionnaireV2/studio/conditionSummary";

import type { EnableWhen, Question } from "@/types/questionnaire/question";

import {
  type BuilderState,
  buildCondition,
  builderReducer,
  migrateLegacyBooleanEnableWhen,
  normalizeExistsConditionAnswer,
} from "./builderReducer";

/** Conditions as they appear in stored data the union cannot express — the
 *  "Yes"/"No" strings earlier builder versions wrote under `exists`. */
function legacyCondition(raw: {
  question: string;
  operator: string;
  answer: unknown;
}): EnableWhen {
  return raw as unknown as EnableWhen;
}

/** Emits i18n keys rather than copy, so the summary a pane would show is
 *  assertable without loading translations. */
const tStub = ((key: string, options?: { summary?: string }) =>
  options?.summary
    ? `${key}(${options.summary})`
    : key) as unknown as TFunction;

/** Minimal Question builder — link_id mirrors the id so conditions can name
 *  a target with the same string the test reads. */
function q(over: Partial<Question> & Pick<Question, "id" | "type">): Question {
  return {
    link_id: over.id,
    text: over.id,
    ...over,
  };
}

/** Depth-first lookup by id, so assertions can name a question without
 *  tracking where the reducer left it in the tree. */
function findById(questions: Question[], id: string): Question {
  const search = (list: Question[]): Question | undefined => {
    for (const question of list) {
      if (question.id === id) return question;
      const found = search(question.questions ?? []);
      if (found) return found;
    }
    return undefined;
  };
  const found = search(questions);
  if (!found) throw new Error(`question "${id}" not found`);
  return found;
}

describe("normalizeExistsConditionAnswer", () => {
  it("reads every spelling of 'no value' as false", () => {
    assert.equal(normalizeExistsConditionAnswer(false), false);
    assert.equal(normalizeExistsConditionAnswer("false"), false);
    assert.equal(normalizeExistsConditionAnswer("No"), false);
    assert.equal(normalizeExistsConditionAnswer("no"), false);
  });

  it("defaults to true for everything else", () => {
    assert.equal(normalizeExistsConditionAnswer(true), true);
    assert.equal(normalizeExistsConditionAnswer("Yes"), true);
    assert.equal(normalizeExistsConditionAnswer(undefined), true);
  });
});

describe("buildCondition", () => {
  it("persists exists answers as literal booleans", () => {
    assert.deepEqual(buildCondition("q1", "exists", "No"), {
      question: "q1",
      operator: "exists",
      answer: false,
    });
    assert.deepEqual(buildCondition("q1", "exists", "Yes"), {
      question: "q1",
      operator: "exists",
      answer: true,
    });
  });

  it("converts a boolean answer to the 'Yes'/'No' convention for equals", () => {
    assert.deepEqual(buildCondition("q1", "equals", false), {
      question: "q1",
      operator: "equals",
      answer: "No",
    });
    assert.deepEqual(buildCondition("q1", "not_equals", true), {
      question: "q1",
      operator: "not_equals",
      answer: "Yes",
    });
  });

  it("leaves equals string answers byte-identical", () => {
    assert.deepEqual(buildCondition("q1", "equals", "true"), {
      question: "q1",
      operator: "equals",
      answer: "true",
    });
  });

  it("coerces comparison answers to numbers", () => {
    assert.deepEqual(buildCondition("q1", "greater", 0.5), {
      question: "q1",
      operator: "greater",
      answer: 0.5,
    });
    assert.deepEqual(buildCondition("q1", "less_or_equals", "Yes"), {
      question: "q1",
      operator: "less_or_equals",
      answer: 0,
    });
  });
});

describe("migrateLegacyBooleanEnableWhen", () => {
  const dependent = (enable_when: EnableWhen[]): Question[] => [
    q({ id: "target", type: "boolean" }),
    q({ id: "dependent", type: "string", enable_when }),
  ];

  it("heals exists answers written as strings without changing how they evaluate", () => {
    // A literal `false` is the only answer either evaluator reads as "target
    // is empty", so a legacy "No" was already enabling on "target answered".
    for (const answer of ["No", "Yes", "false", "true"]) {
      const migrated = migrateLegacyBooleanEnableWhen(
        dependent([
          legacyCondition({ question: "target", operator: "exists", answer }),
        ]),
      );
      assert.deepEqual(
        migrated[1].enable_when,
        [{ question: "target", operator: "exists", answer: true }],
        `legacy exists answer ${JSON.stringify(answer)}`,
      );
    }
  });

  it("heals exists answers on non-boolean targets too", () => {
    const migrated = migrateLegacyBooleanEnableWhen([
      q({ id: "target", type: "string" }),
      q({
        id: "dependent",
        type: "string",
        enable_when: [
          legacyCondition({
            question: "target",
            operator: "exists",
            answer: "No",
          }),
        ],
      }),
    ]);
    assert.deepEqual(migrated[1].enable_when, [
      { question: "target", operator: "exists", answer: true },
    ]);
  });

  it("heals an exists answer whose target is not in the tree", () => {
    const migrated = migrateLegacyBooleanEnableWhen([
      q({
        id: "dependent",
        type: "string",
        enable_when: [
          legacyCondition({
            question: "missing",
            operator: "exists",
            answer: "No",
          }),
        ],
      }),
    ]);
    assert.deepEqual(migrated[0].enable_when, [
      { question: "missing", operator: "exists", answer: true },
    ]);
  });

  it("leaves the visibility editor and the plain-words summary agreeing", () => {
    // The two panes read the stored answer independently — the editor's
    // Select through `normalizeExistsConditionAnswer`, the inspector
    // through its own `=== false` test — so agreement has to hold on BOTH
    // polarities. Either pane hardcoding one of them still satisfies a
    // single-polarity check.
    const agreement: [EnableWhen, boolean, string][] = [
      [
        legacyCondition({
          question: "target",
          operator: "exists",
          answer: "No",
        }),
        true,
        "condition_rule_answered",
      ],
      [
        { question: "target", operator: "exists", answer: true },
        true,
        "condition_rule_answered",
      ],
      [
        { question: "target", operator: "exists", answer: false },
        false,
        "condition_rule_not_answered",
      ],
    ];

    for (const [stored, editorShows, summaryKey] of agreement) {
      const migrated = migrateLegacyBooleanEnableWhen([
        q({ id: "target", type: "string" }),
        q({ id: "dependent", type: "string", enable_when: [stored] }),
      ]);
      const label = JSON.stringify(stored.answer);
      const condition = migrated[1].enable_when![0];
      assert.equal(
        normalizeExistsConditionAnswer(condition.answer),
        editorShows,
        `editor Select, stored answer ${label}`,
      );
      assert.equal(
        plainWordsSummary(migrated[1], questionsByLinkId(migrated), tStub),
        `plain_words_shown_when(${summaryKey})`,
        `inspector summary, stored answer ${label}`,
      );
    }
  });

  it("leaves an exists answer that is already a boolean untouched", () => {
    const questions = dependent([
      { question: "target", operator: "exists", answer: false },
    ]);
    const migrated = migrateLegacyBooleanEnableWhen(questions);
    assert.equal(migrated[1], questions[1]);
  });

  it("still maps legacy true/false equals answers to 'Yes'/'No'", () => {
    const migrated = migrateLegacyBooleanEnableWhen(
      dependent([{ question: "target", operator: "equals", answer: true }]),
    );
    assert.deepEqual(migrated[1].enable_when, [
      { question: "target", operator: "equals", answer: "Yes" },
    ]);
  });

  it("leaves a string question's literal 'true' comparison alone", () => {
    const questions = [
      q({ id: "target", type: "string" }),
      q({
        id: "dependent",
        type: "string",
        enable_when: [
          { question: "target", operator: "equals", answer: "true" },
        ],
      }),
    ];
    const migrated = migrateLegacyBooleanEnableWhen(questions);
    assert.equal(migrated[1], questions[1]);
  });

  it("migrates conditions on nested questions", () => {
    const migrated = migrateLegacyBooleanEnableWhen([
      q({ id: "target", type: "boolean" }),
      q({
        id: "group",
        type: "group",
        questions: [
          q({
            id: "child",
            type: "string",
            enable_when: [
              legacyCondition({
                question: "target",
                operator: "exists",
                answer: "Yes",
              }),
            ],
          }),
        ],
      }),
    ]);
    assert.deepEqual(migrated[1].questions?.[0].enable_when, [
      { question: "target", operator: "exists", answer: true },
    ]);
  });
});

describe("removeQuestions — conditions naming the deleted question", () => {
  const remove = (questions: Question[], ids: string[]): Question[] => {
    const state: BuilderState = { questions, selectedId: null, dirty: false };
    return builderReducer(state, { type: "removeQuestions", ids }).questions;
  };

  it("drops the dangling condition instead of leaving the dependent hidden forever", () => {
    // Left in place, the condition survives the save and every evaluator
    // resolves the missing response to false — the dependent never shows.
    const questions = remove(
      [
        q({ id: "age", type: "integer" }),
        q({
          id: "dependent",
          type: "string",
          enable_when: [buildCondition("age", "equals", "18")],
        }),
      ],
      ["age"],
    );

    assert.equal(questions.length, 1);
    assert.deepEqual(questions[0].enable_when, []);
  });

  it("keeps the conditions whose targets survive the delete", () => {
    const questions = remove(
      [
        q({ id: "age", type: "integer" }),
        q({ id: "weight", type: "integer" }),
        q({
          id: "dependent",
          type: "string",
          enable_when: [
            buildCondition("age", "equals", "18"),
            buildCondition("weight", "greater", 50),
          ],
        }),
      ],
      ["age"],
    );

    assert.deepEqual(findById(questions, "dependent").enable_when, [
      { question: "weight", operator: "greater", answer: 50 },
    ]);
  });

  it("drops conditions naming a descendant of a deleted group", () => {
    // Deleting a group takes its children's link_ids with it, so a condition
    // on a child dangles just as one on the group itself would.
    const questions = remove(
      [
        q({
          id: "section",
          type: "group",
          questions: [q({ id: "nested", type: "boolean" })],
        }),
        q({
          id: "dependent",
          type: "string",
          enable_when: [buildCondition("nested", "equals", true)],
        }),
      ],
      ["section"],
    );

    assert.deepEqual(questions[0].enable_when, []);
  });

  it("cleans conditions on questions nested inside surviving groups", () => {
    const questions = remove(
      [
        q({ id: "age", type: "integer" }),
        q({
          id: "section",
          type: "group",
          questions: [
            q({
              id: "nested-dependent",
              type: "string",
              enable_when: [buildCondition("age", "equals", "18")],
            }),
          ],
        }),
      ],
      ["age"],
    );

    assert.deepEqual(findById(questions, "nested-dependent").enable_when, []);
  });

  it("leaves an untouched question at the same reference, so the tree keeps identity", () => {
    const unrelated = q({
      id: "dependent",
      type: "string",
      enable_when: [buildCondition("weight", "equals", "50")],
    });
    const questions = remove(
      [
        q({ id: "age", type: "integer" }),
        q({ id: "weight", type: "integer" }),
        unrelated,
      ],
      ["age"],
    );

    assert.equal(findById(questions, "dependent"), unrelated);
  });
});
