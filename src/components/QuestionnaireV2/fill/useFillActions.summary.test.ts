import assert from "node:assert/strict";
import { test } from "node:test";

import { createStore } from "jotai";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { Question } from "@/types/questionnaire/question";

import type { FillFormEntry } from "./formSession";
import { applySetResponse, listFormsSummary } from "./useFillActions";

function summarySession(questions: Question[]) {
  const forms: FillFormEntry[] = [
    {
      key: "form",
      isPrimary: true,
      questionnaire: {
        id: "form",
        slug: "form",
        title: "Clinical note",
        version: "1",
        status: "active",
        subject_type: "encounter",
        questions,
      },
    },
  ];
  const store = createStore();
  store.set(responsesAtom, initializeResponses(questions));
  const getStore = () => store;
  return {
    fill(link_id: string, value: boolean | string) {
      return applySetResponse({ link_id, values: [value] }, forms, getStore);
    },
    summaries() {
      const result = listFormsSummary(forms, getStore);
      assert.equal(result.ok, true);
      assert.ok(result.ok);
      const data = result.data as {
        questions: Array<Record<string, unknown>>;
      }[];
      return Object.fromEntries(
        data[0].questions.map((question) => [question.link_id, question]),
      );
    },
  };
}

test("form summaries expose helper text and default or explicit condition behavior", async () => {
  for (const behavior of [undefined, "all", "any"] as const) {
    const conditions: Question["enable_when"] = [
      { question: "first-trigger", operator: "equals", answer: true },
      { question: "second-trigger", operator: "equals", answer: true },
    ];
    const { fill, summaries } = summarySession([
      {
        id: "first",
        link_id: "first-trigger",
        text: "First trigger",
        type: "boolean",
      },
      {
        id: "second",
        link_id: "second-trigger",
        text: "Second trigger",
        type: "boolean",
      },
      {
        id: "detail",
        link_id: "detail",
        text: "Additional detail",
        type: "string",
        description: "Include the duration and severity of the symptoms.",
        enable_when: conditions,
        enable_behavior: behavior,
      },
    ]);

    const initial = summaries();
    assert.equal(
      initial.detail.description,
      "Include the duration and severity of the symptoms.",
    );
    assert.deepEqual(initial.detail.enable_when, conditions);
    assert.equal(initial.detail.enable_behavior, behavior ?? "all");
    assert.equal(initial.detail.ancestors_enabled, true);
    assert.equal(initial.detail.enabled, false);
    assert.equal("description" in initial["first-trigger"], false);
    assert.equal("enable_when" in initial["first-trigger"], false);

    // These writes only update the local form, without a save or rerender.
    assert.deepEqual(await fill("first-trigger", true), { ok: true });
    const oneTrigger = summaries();
    assert.deepEqual(oneTrigger["first-trigger"].values, [true]);
    assert.equal(oneTrigger["first-trigger"].answered, true);
    assert.equal(oneTrigger.detail.enabled, behavior === "any");

    assert.deepEqual(await fill("second-trigger", true), { ok: true });
    assert.equal(summaries().detail.enabled, true);
  }
});

test("form summaries keep descendants disabled until every ancestor is enabled", async () => {
  const { fill, summaries } = summarySession([
    ...["outer-trigger", "inner-trigger", "own-trigger"].map(
      (link_id): Question => ({
        id: `${link_id}-id`,
        link_id,
        text: link_id,
        type: "boolean",
      }),
    ),
    {
      id: "outer",
      link_id: "outer",
      text: "Outer group",
      type: "group",
      enable_when: [
        { question: "outer-trigger", operator: "equals", answer: true },
      ],
      questions: [
        {
          id: "inner",
          link_id: "inner",
          text: "Inner group",
          type: "group",
          enable_when: [
            { question: "inner-trigger", operator: "equals", answer: true },
          ],
          questions: [
            {
              id: "conditional",
              link_id: "conditional",
              text: "Conditional detail",
              type: "string",
              enable_when: [
                { question: "own-trigger", operator: "equals", answer: true },
              ],
            },
            {
              id: "unconditional",
              link_id: "unconditional",
              text: "Detail without its own conditions",
              type: "string",
            },
          ],
        },
      ],
    },
  ]);

  assert.deepEqual(await fill("own-trigger", true), { ok: true });
  assert.deepEqual(await fill("inner-trigger", true), { ok: true });
  const hidden = summaries();
  for (const linkId of ["conditional", "unconditional"]) {
    assert.equal(hidden[linkId].enabled, false);
    assert.equal(hidden[linkId].ancestors_enabled, false);
    assert.equal((await fill(linkId, "Hidden detail")).ok, false);
  }

  assert.deepEqual(await fill("outer-trigger", true), { ok: true });
  const enabled = summaries();
  for (const linkId of ["conditional", "unconditional"]) {
    assert.equal(enabled[linkId].enabled, true);
    assert.equal(enabled[linkId].ancestors_enabled, true);
    assert.deepEqual(await fill(linkId, "Visible detail"), { ok: true });
  }

  assert.deepEqual(await fill("own-trigger", false), { ok: true });
  const ownConditionUnmet = summaries();
  assert.equal(ownConditionUnmet.conditional.enabled, false);
  assert.equal(ownConditionUnmet.conditional.ancestors_enabled, true);
  assert.equal(ownConditionUnmet.unconditional.enabled, true);

  assert.deepEqual(await fill("inner-trigger", false), { ok: true });
  const ancestorConditionUnmet = summaries();
  assert.equal(ancestorConditionUnmet.unconditional.enabled, false);
  assert.equal(ancestorConditionUnmet.unconditional.ancestors_enabled, false);
});
