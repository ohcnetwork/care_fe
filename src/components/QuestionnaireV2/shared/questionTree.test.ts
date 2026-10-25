import assert from "node:assert/strict";
import { test } from "node:test";

import type { Question } from "@/types/questionnaire/question";

import { regenerateQuestionIdsWithMap } from "./questionTree";

test("copies registered groups with new instance ids and stable local child keys", () => {
  const group: Question = {
    id: "group",
    link_id: "chart",
    text: "Chart",
    type: "group",
    structured_type: "dental.chart",
    questions: [
      { id: "tooth", link_id: "chart__tooth", text: "Tooth", type: "integer" },
      {
        id: "surface",
        link_id: "chart__surface",
        text: "Surface",
        type: "string",
        repeats: true,
        enable_when: [
          { question: "chart__tooth", operator: "exists", answer: true },
        ],
      },
    ],
  };
  const {
    questions: [copy],
    linkIdMap,
  } = regenerateQuestionIdsWithMap([group]);
  assert.notEqual(copy.id, group.id);
  assert.notEqual(copy.link_id, group.link_id);
  assert.equal(copy.structured_type, group.structured_type);
  assert.equal(copy.questions![0].link_id, `${copy.link_id}__tooth`);
  assert.equal(copy.questions![1].link_id, `${copy.link_id}__surface`);
  assert.notEqual(copy.questions![0].id, group.questions![0].id);
  assert.equal(copy.questions![1].repeats, true);
  assert.equal(
    copy.questions![1].enable_when![0].question,
    copy.questions![0].link_id,
  );
  assert.equal(linkIdMap.get("chart__tooth"), copy.questions![0].link_id);
  assert.equal(group.questions![0].link_id, "chart__tooth");
});

test("import gives duplicate group instances distinct prefixes and keeps the first reference mapping", () => {
  const group: Question = {
    id: "group",
    link_id: "chart",
    type: "group",
    text: "Chart",
    structured_type: "dental.chart",
    questions: [
      { id: "child", link_id: "chart__tooth", text: "Tooth", type: "integer" },
    ],
  };
  const {
    questions: [first, second],
    linkIdMap,
  } = regenerateQuestionIdsWithMap([group, group]);
  assert.notEqual(first.link_id, second.link_id);
  assert.equal(first.questions![0].link_id, `${first.link_id}__tooth`);
  assert.equal(second.questions![0].link_id, `${second.link_id}__tooth`);
  assert.equal(linkIdMap.get("chart__tooth"), first.questions![0].link_id);
});
