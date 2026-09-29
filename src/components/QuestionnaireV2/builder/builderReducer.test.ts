import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Question } from "@/types/questionnaire/question";

import {
  buildCondition,
  builderReducer,
  type BuilderAction,
} from "./builderReducer";

describe("registered group schema protection", () => {
  const child = q({ id: "child", link_id: "chart__tooth", type: "integer" });
  const group = q({
    id: "group",
    link_id: "chart",
    type: "group",
    structured_type: "dental.chart",
    questions: [child],
  });
  const state = {
    questions: [group, q({ id: "other", type: "string" })],
    actions: [],
    selectedId: group.id,
    dirty: false,
  };

  it("blocks generic descendant edits and inserting or moving fields into the group", () => {
    const actions: BuilderAction[] = [
      { type: "updateQuestion", id: child.id, patch: { type: "string" } },
      { type: "renameLinkId", id: child.id, linkId: "renamed" },
      { type: "duplicateQuestion", id: child.id },
      { type: "removeQuestions", ids: [child.id] },
      { type: "moveQuestion", id: child.id, direction: "up" },
      {
        type: "moveQuestions",
        ids: [child.id],
        targetParentId: null,
        index: 0,
      },
      {
        type: "moveQuestions",
        ids: ["other"],
        targetParentId: group.id,
        index: 0,
      },
      { type: "addQuestion", parentId: group.id },
    ];
    for (const action of actions)
      assert.equal(builderReducer(state, action), state, action.type);
    assert.equal(
      builderReducer(state, { type: "select", id: child.id }).selectedId,
      group.id,
    );
  });

  it("allows plug builder schema edits and whole-group operations", () => {
    const edited = builderReducer(state, {
      type: "updateQuestion",
      id: group.id,
      patch: { questions: [{ ...child, text: "Updated tooth" }] },
    });
    assert.equal(edited.questions[0].questions![0].text, "Updated tooth");
    const duplicated = builderReducer(state, {
      type: "duplicateQuestion",
      id: group.id,
    });
    assert.equal(duplicated.questions.length, 3);
    assert.equal(
      duplicated.questions[1].questions![0].link_id,
      `${duplicated.questions[1].link_id}__tooth`,
    );
    assert.equal(
      builderReducer(state, {
        type: "removeQuestions",
        ids: [group.id, child.id],
      }).questions.length,
      1,
    );
    assert.equal(
      builderReducer(state, {
        type: "moveQuestion",
        id: group.id,
        direction: "down",
      }).questions[1].id,
      group.id,
    );
    const simple = builderReducer(state, {
      type: "updateQuestion",
      id: group.id,
      patch: { structured_type: undefined },
    });
    assert.deepEqual(simple.questions[0].questions, [child]);
    assert.equal(
      builderReducer(simple, {
        type: "updateQuestion",
        id: child.id,
        patch: { text: "Editable" },
      }).questions[0].questions![0].text,
      "Editable",
    );
  });

  it("rebases child links and dependent conditions/actions when the group link changes", () => {
    const withReferences = {
      ...state,
      questions: [
        group,
        q({
          id: "dependent",
          type: "string",
          enable_when: [
            { question: child.link_id, operator: "exists", answer: true },
          ],
        }),
      ],
      actions: [{ condition: "q_chart__tooth == 1", instructions: [] }],
    };
    const renamed = builderReducer(withReferences, {
      type: "renameLinkId",
      id: group.id,
      linkId: "new_chart",
    });
    assert.equal(
      renamed.questions[0].questions![0].link_id,
      "new_chart__tooth",
    );
    assert.equal(
      renamed.questions[1].enable_when![0].question,
      "new_chart__tooth",
    );
    assert.equal(renamed.actions[0].condition, "q_new_chart__tooth == 1");
  });
});

/** Minimal Question builder — link_id mirrors the id so conditions can name
 *  a target with the same string the test reads. */
function q(over: Partial<Question> & Pick<Question, "id" | "type">): Question {
  return {
    link_id: over.id,
    text: over.id,
    ...over,
  };
}

describe("buildCondition", () => {
  it("persists exists answers as literal booleans", () => {
    assert.deepEqual(buildCondition("q1", "exists", false), {
      question: "q1",
      operator: "exists",
      answer: false,
    });
    assert.deepEqual(buildCondition("q1", "exists", "Yes"), {
      question: "q1",
      operator: "exists",
      answer: false,
    });
    assert.deepEqual(buildCondition("q1", "exists", true), {
      question: "q1",
      operator: "exists",
      answer: true,
    });
  });

  it("persists equals answers as strings", () => {
    assert.deepEqual(buildCondition("q1", "equals", "No"), {
      question: "q1",
      operator: "equals",
      answer: "No",
    });
    assert.deepEqual(buildCondition("q1", "not_equals", 3), {
      question: "q1",
      operator: "not_equals",
      answer: "3",
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

  it("re-importing questions remaps retained action conditions and templates", () => {
    const previous = {
      ...state,
      actions: [
        {
          condition: "q_original == 1",
          instructions: [
            {
              slug: "show_message",
              context: "self",
              params: { message: '{{ f"Value: {q_original}" }}' },
            },
          ],
        },
      ],
    };
    const next = builderReducer(previous, {
      type: "replaceAll",
      questions: [
        q({ id: "imported", link_id: "replacement", type: "integer" }),
      ],
      linkIdMap: new Map([["original", "replacement"]]),
    });
    assert.equal(next.actions[0].condition, "q_replacement == 1");
    assert.equal(
      next.actions[0].instructions[0].params.message,
      '{{ f"Value: {q_replacement}" }}',
    );
    assert.equal(previous.actions[0].condition, "q_original == 1");
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
