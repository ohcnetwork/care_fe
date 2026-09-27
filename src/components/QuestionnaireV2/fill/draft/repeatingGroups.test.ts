import assert from "node:assert/strict";
import { test } from "node:test";

import { initializeResponses } from "@/components/QuestionnaireV2/form/engine/store";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { serializeQuestionResults } from "@/components/QuestionnaireV2/fill/submit/serializeQuestionResults";
import { draftResponseHasContent, mergeDraftResponses } from "./draftMerge";
import { isDraftResponse, reviveDraftResponses } from "./fillDraftCore";
import { parseServerDraft } from "./serverDraft";

const question = (
  id: string,
  type: Question["type"],
  extra: Partial<Question> = {},
): Question => ({
  id,
  link_id: id,
  text: id,
  type,
  ...extra,
});
const choice = (id: string, values: string[]) =>
  question(id, "choice", {
    answer_option: values.map((value) => ({ value })),
  });
const childQuestions = [
  choice("tooth", ["16", "17"]),
  choice("finding", ["caries", "missing"]),
  question("date", "dateTime"),
  question("details", "group", {
    enable_when: [
      { question: "finding", operator: "equals", answer: "caries" },
    ],
    questions: [question("note", "string")],
  }),
  question("visits", "group", {
    repeats: true,
    enable_when: [
      { question: "finding", operator: "equals", answer: "caries" },
    ],
    questions: [question("score", "integer"), question("done", "boolean")],
  }),
];
const questions = [
  question("show", "boolean"),
  question("findings", "group", {
    repeats: true,
    structured_type: "dental.chart",
    enable_when: [{ question: "show", operator: "equals", answer: true }],
    questions: childQuestions,
  }),
];
const answer = (
  id: string,
  values: ResponseValue[],
): QuestionnaireResponse => ({
  question_id: id,
  link_id: id,
  structured_type: null,
  values,
});
function responses() {
  const seeded = initializeResponses(questions);
  seeded.show.values = [{ type: "boolean", value: true }];
  seeded.findings.sub_results = ["caries", "missing"].map((finding, index) => [
    answer("tooth", [{ type: "string", value: index ? "17" : "16" }]),
    answer("finding", [{ type: "string", value: finding }]),
    answer("date", [
      { type: "dateTime", value: new Date("2026-09-26T12:00:00Z") },
    ]),
    answer("note", [
      { type: "string", value: index ? "Hidden stale answer" : "Visible note" },
    ]),
    {
      ...answer("visits", []),
      sub_results: [
        [
          answer("score", [{ type: "number", value: 0 }]),
          answer("done", [{ type: "boolean", value: false }]),
        ],
      ],
    },
  ]);
  return seeded;
}

test("repeating drafts retain row boundaries and revive dates recursively", () => {
  const original = responses();
  assert.equal(original.tooth, undefined);
  assert.equal(draftResponseHasContent(original.findings), true);
  const stored = JSON.parse(JSON.stringify(original)) as Record<
    string,
    QuestionnaireResponse
  >;
  assert.equal(isDraftResponse(stored.findings), true);
  const restored = mergeDraftResponses(questions, reviveDraftResponses(stored));
  assert.deepEqual(restored.dropped, []);
  assert.deepEqual(restored.responses, original);
  assert.equal(
    restored.responses.findings.sub_results?.[1].find(
      (entry) => entry.question_id === "tooth",
    )?.values[0].value,
    "17",
  );

  const malformed = { ...original.findings, sub_results: [[null]] };
  assert.equal(isDraftResponse(malformed), false);
  const parsed = parseServerDraft(
    {
      status: "draft",
      response_dump: {
        questionnaireResponses: {
          questionnaire: { id: "form" },
          responses: [malformed],
        },
      },
    },
    { id: "form", questions },
  );
  assert.equal(parsed.mismatch, true);
});

test("submission scopes conditional children to each row and skips disabled group subtrees", () => {
  const state = responses();
  const result = serializeQuestionResults(questions, state);
  assert.deepEqual(
    result.map((entry) => entry.question_id),
    ["show", "findings"],
  );
  const rows = result[1].sub_results!;
  assert.equal(rows.length, 2);
  assert.equal(
    rows[0].find((entry) => entry.question_id === "tooth")?.values?.[0].value,
    "16",
  );
  assert.equal(
    rows[1].find((entry) => entry.question_id === "tooth")?.values?.[0].value,
    "17",
  );
  assert.equal(
    rows[0].find((entry) => entry.question_id === "note")?.values?.[0].value,
    "Visible note",
  );
  assert.equal(
    rows[1].some(
      (entry) => entry.question_id === "note" || entry.question_id === "visits",
    ),
    false,
  );
  const nested = rows[0].find((entry) => entry.question_id === "visits")
    ?.sub_results?.[0];
  assert.deepEqual(
    nested?.map((entry) => entry.values?.[0].value),
    ["0", "false"],
  );
  assert.equal(
    rows[0].find((entry) => entry.question_id === "date")?.values?.[0].value,
    "2026-09-26T12:00:00.000Z",
  );

  state.show.values = [{ type: "boolean", value: false }];
  assert.deepEqual(
    serializeQuestionResults(questions, state).map(
      (entry) => entry.question_id,
    ),
    ["show"],
  );
});

test("draft schema changes drop only incompatible row answers", () => {
  const updated = structuredClone(questions);
  updated[1].questions![0].answer_option = [{ value: "17" }];
  const restored = mergeDraftResponses(updated, responses());
  assert.equal(restored.dropped[0].reason, "option_removed");
  assert.deepEqual(restored.responses.findings.sub_results?.[0][0].values, []);
  assert.equal(
    restored.responses.findings.sub_results?.[1][0].values[0].value,
    "17",
  );
});
