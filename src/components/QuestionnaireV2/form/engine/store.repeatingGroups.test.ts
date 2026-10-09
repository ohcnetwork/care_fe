import assert from "node:assert/strict";
import { test } from "node:test";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import {
  questionSignatures,
  syncResponses,
} from "@/components/QuestionnaireV2/form/FormContext";
import {
  getResponsesAtPath,
  getScopedResponses,
  responseMap,
  updateResponsesAtPath,
} from "./responseScope";
import {
  buildLinkIndex,
  initializeResponses,
  isQuestionEnabledInState,
} from "./store";

const tooth: Question = {
  id: "tooth",
  link_id: "chart__tooth",
  text: "Tooth",
  type: "choice",
  required: true,
  answer_option: [{ value: "11" }, { value: "21" }],
};
const finding: Question = {
  id: "finding",
  link_id: "chart__type",
  text: "Type",
  type: "choice",
  required: true,
  answer_option: [{ value: "caries" }, { value: "crown" }],
};
const group: Question = {
  id: "chart",
  link_id: "chart",
  text: "Chart",
  type: "group",
  repeats: true,
  structured_type: "dental.chart",
  questions: [tooth, finding],
};
const plain: Question = {
  id: "plain",
  link_id: "plain",
  text: "Plain",
  type: "string",
};
function row(
  toothValue: string,
  findingValue: string,
): QuestionnaireResponse[] {
  const responses = initializeResponses(group.questions!);
  responses.tooth.values = [{ type: "string", value: toothValue }];
  responses.finding.values = [{ type: "string", value: findingValue }];
  return Object.values(responses);
}

test("repeating groups seed containers and independent rows, ordinary groups stay flattened", () => {
  const responses = initializeResponses([
    group,
    {
      ...group,
      id: "simple",
      type: "group",
      repeats: false,
      questions: [plain],
    },
  ]);
  assert.deepEqual(Object.keys(responses), ["chart", "plain"]);
  assert.deepEqual(responses.chart.sub_results, []);
  assert.deepEqual(responses.chart.values, []);
  assert.notEqual(
    initializeResponses(group.questions!).tooth,
    initializeResponses(group.questions!).tooth,
  );
});

test("row writes and conditions use only that occurrence and preserve its siblings", () => {
  const responses = initializeResponses([group, plain]);
  responses.chart.sub_results = [row("11", "caries"), row("21", "crown")];
  const path = [{ questionId: group.id, rowIndex: 0 }];
  const sibling = responses.chart.sub_results[1];
  const updated = updateResponsesAtPath(responses, path, {
    finding: { values: [{ type: "string", value: "crown" }] },
  });
  assert.deepEqual(getResponsesAtPath(updated, path).finding.values, [
    { type: "string", value: "crown" },
  ]);
  assert.equal(updated.chart.sub_results![1], sibling);
  assert.deepEqual(responseMap(responses.chart.sub_results[0]).finding.values, [
    { type: "string", value: "caries" },
  ]);
  const dependent: Question = {
    ...plain,
    enable_when: [
      { question: tooth.link_id, operator: "equals", answer: "11" },
    ],
  };
  const index = buildLinkIndex([group, plain]);
  assert.equal(
    isQuestionEnabledInState(
      dependent,
      getScopedResponses(updated, path),
      index,
    ),
    true,
  );
  assert.equal(
    isQuestionEnabledInState(
      dependent,
      getScopedResponses(updated, [{ questionId: group.id, rowIndex: 1 }]),
      index,
    ),
    false,
  );
  assert.equal(getScopedResponses(updated, path).plain, responses.plain);
  assert.equal(updated.finding, undefined);
});

test("nested repeating rows retain their enclosing group and sibling instances", () => {
  const outer: Question = {
    id: "outer",
    link_id: "outer",
    text: "Outer",
    type: "group",
    repeats: true,
    questions: [group],
  };
  const responses = initializeResponses([outer]);
  const nested = initializeResponses([group]);
  nested.chart.sub_results = [row("11", "caries"), row("21", "crown")];
  responses.outer.sub_results = [Object.values(nested)];
  const path = [
    { questionId: "outer", rowIndex: 0 },
    { questionId: "chart", rowIndex: 1 },
  ];
  const updated = updateResponsesAtPath(responses, path, {
    tooth: { values: [{ type: "string", value: "11" }] },
  });
  assert.equal(getResponsesAtPath(updated, path).tooth.values[0].value, "11");
  assert.equal(getResponsesAtPath(responses, path).tooth.values[0].value, "21");
  assert.equal(
    getResponsesAtPath(updated, [{ questionId: "outer", rowIndex: 0 }]).chart
      .sub_results![0],
    nested.chart.sub_results[0],
  );
  assert.equal(
    updateResponsesAtPath(
      responses,
      [{ questionId: "missing", rowIndex: 0 }],
      {},
    ),
    responses,
  );
});

test("live schema sync keeps rows, seeds new children and drops incompatible values", () => {
  const responses = initializeResponses([group]);
  responses.chart.sub_results = [row("11", "caries"), row("21", "crown")];
  const signatures = questionSignatures([group]);
  const titleOnly = syncResponses(responses, signatures, [
    { ...group, text: "Renamed" },
  ]);
  assert.equal(titleOnly.chart, responses.chart);
  const changed = syncResponses(responses, signatures, [
    { ...group, questions: [{ ...tooth, type: "string" }, plain] },
  ]);
  assert.equal(changed.chart.sub_results!.length, 2);
  for (const entry of changed.chart.sub_results!) {
    const fields = responseMap(entry);
    assert.deepEqual(fields.tooth.values, []);
    assert.ok(fields.plain);
    assert.equal(fields.finding, undefined);
  }
  assert.equal(responses.chart.sub_results[0][1].question_id, "finding");
});
