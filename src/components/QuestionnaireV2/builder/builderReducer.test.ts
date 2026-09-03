import type { TFunction } from "i18next";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  plainWordsSummary,
  questionsByLinkId,
} from "@/components/QuestionnaireV2/studio/conditionSummary";

import type { EnableWhen, Question } from "@/types/questionnaire/question";

import {
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

describe("actions in the builder state", () => {
  const fever = q({ id: "Q-fever", type: "boolean" });
  const followUp = q({
    id: "followup",
    type: "string",
    enable_when: [{ question: "Q-fever", operator: "equals", answer: "Yes" }],
  });
  const state = builderReducer(
    { questions: [], actions: [], selectedId: null, dirty: false },
    {
      type: "reset",
      questions: [fever, followUp],
      actions: [{ condition: "True", instructions: [] }],
    },
  );

  it("reset seeds actions clean; setActions replaces them dirty", () => {
    assert.equal(state.dirty, false);
    assert.equal(state.actions.length, 1);
    const next = builderReducer(state, {
      type: "setActions",
      actions: [],
    });
    assert.deepEqual(next.actions, []);
    assert.equal(next.dirty, true);
  });

  it("question edits carry actions through untouched", () => {
    const next = builderReducer(state, {
      type: "addQuestion",
      parentId: null,
    });
    assert.equal(next.actions, state.actions);
    const removed = builderReducer(next, {
      type: "removeQuestions",
      ids: [next.selectedId!],
    });
    assert.equal(removed.actions, state.actions);
    const imported = builderReducer(state, {
      type: "replaceAll",
      questions: [fever],
    });
    assert.equal(imported.actions, state.actions);
  });

  it("renameLinkId follows the rename through enable_when and action refs", () => {
    // The legacy-id case: nothing can reference `q_Q-fever` (not a name),
    // so only enable_when targets follow the first rename…
    const renamed = builderReducer(state, {
      type: "renameLinkId",
      id: "Q-fever",
      linkId: "Q_fever",
    });
    assert.equal(renamed.questions[0].link_id, "Q_fever");
    assert.deepEqual(renamed.questions[1].enable_when, [
      { question: "Q_fever", operator: "equals", answer: "Yes" },
    ]);
    assert.equal(renamed.dirty, true);
    // …while a rename of a referenced id rewrites the action too.
    const withRef = builderReducer(renamed, {
      type: "setActions",
      actions: [
        {
          condition: "q_Q_fever == True",
          instructions: [
            {
              slug: "logging",
              params: { message: "{{ q_Q_fever }}" },
              context: "self",
            },
          ],
        },
      ],
    });
    const again = builderReducer(withRef, {
      type: "renameLinkId",
      id: "Q-fever",
      linkId: "fever",
    });
    assert.equal(again.questions[0].link_id, "fever");
    assert.equal(again.questions[1].enable_when?.[0].question, "fever");
    assert.equal(again.actions[0].condition, "q_fever == True");
    assert.equal(
      again.actions[0].instructions[0].params.message,
      "{{ q_fever }}",
    );
    // A no-op rename leaves the state identity alone.
    assert.equal(
      builderReducer(renamed, {
        type: "renameLinkId",
        id: "Q-fever",
        linkId: "Q_fever",
      }),
      renamed,
    );
  });
});
