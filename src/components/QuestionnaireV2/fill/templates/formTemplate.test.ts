import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { describe, it } from "node:test";

import { updateResponsesAtPath } from "@/components/QuestionnaireV2/form/engine/responseScope";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import type { QuestionnaireAnswer } from "@/types/questionnaire/questionnaireResponseTemplate";

// The order serializer shares real domain constants, whose decimal helpers
// read Vite configuration at import time. Supply only that environment
// boundary; capture, parsing, schemas and merging remain real.
const require = createRequire(import.meta.url);
const configPath = require.resolve("@careConfig");
const previousConfig = require.cache[configPath];
const configModule = new Module(configPath);
configModule.exports = {
  decimal: { precision: 20, rounding: 4, accountingPrecision: 2 },
};
configModule.loaded = true;
require.cache[configPath] = configModule;
const {
  applyFormTemplate,
  captureFormTemplate,
}: typeof import("./formTemplate") = require("./formTemplate");
if (previousConfig) require.cache[configPath] = previousConfig;
else delete require.cache[configPath];

function question(
  id: string,
  type: Question["type"],
  extra: Partial<Question> = {},
): Question {
  return { id, link_id: id, text: id, type, ...extra };
}

function questionnaire(questions: Question[]): QuestionnaireRead {
  return {
    id: "consultation",
    slug: "consultation",
    title: "Consultation",
    status: "active",
    subject_type: "encounter",
    questions,
  };
}

function response(
  id: string,
  values: QuestionnaireResponse["values"],
  extra: Partial<QuestionnaireResponse> = {},
): QuestionnaireResponse {
  return {
    question_id: id,
    link_id: id,
    structured_type: null,
    values,
    ...extra,
  };
}

describe("reusable form answers", () => {
  it("persists nested ordinary answers across JSON without patient record metadata or attachments", () => {
    const form = questionnaire([
      question("group", "group", {
        questions: [question("zero", "integer"), question("false", "boolean")],
      }),
      question("visits", "group", {
        repeats: true,
        questions: [
          question("date", "date"),
          question("events", "group", {
            repeats: true,
            questions: [
              question("coded", "choice", {
                answer_value_set: { slug: "system-test" },
              }),
            ],
          }),
          question("file", "structured", {
            structured_type: "files",
            text: "Patient attachment",
          }),
        ],
      }),
      question("locked", "string", {
        read_only: true,
        text: "Patient identifier",
      }),
    ]);
    const source = {
      zero: response("zero", [{ type: "number", value: 0 }], {
        taken_at: "2026-09-27T10:00:00Z",
        draft_context: [{ type: "number", value: 44 }],
      }),
      false: response("false", [{ type: "boolean", value: false }]),
      visits: response("visits", [], {
        sub_results: [
          [
            response("date", [
              { type: "date", value: new Date("2026-09-27T00:00:00Z") },
            ]),
            response("events", [], {
              sub_results: [
                [
                  response(
                    "coded",
                    [
                      {
                        type: "string",
                        coding: {
                          system: "clinical",
                          code: "review",
                          display: "Review",
                        },
                      },
                    ],
                    { note: "Reusable note" },
                  ),
                ],
              ],
            }),
            response("file", [{ type: "files", value: [] }], {
              structured_type: "files",
              note: "Patient file note",
            }),
          ],
        ],
      }),
      locked: response("locked", [{ type: "string", value: "patient-123" }]),
      unknown: response("unknown", [
        { type: "string", value: "private orphan" },
      ]),
    };
    Object.assign(source.zero, {
      patient: "patient-123",
      encounter: "encounter-123",
    });
    const snapshot = structuredClone(source);
    const captured = captureFormTemplate(form, source);
    const wire = JSON.stringify(captured.entries);
    assert.deepEqual(captured.excluded, [
      "Patient attachment",
      "Patient identifier",
    ]);
    assert.equal(captured.answerCount, 3);
    for (const forbidden of [
      "patient-123",
      "encounter-123",
      "Patient file note",
      "private orphan",
      "draft_context",
      "taken_at",
    ]) {
      assert.equal(wire.includes(forbidden), false, forbidden);
    }
    const restored = applyFormTemplate(form, {}, JSON.parse(wire)).responses;
    assert.deepEqual(restored.zero.values, [{ type: "number", value: 0 }]);
    assert.deepEqual(restored.false.values, [
      { type: "boolean", value: false },
    ]);
    assert.deepEqual(restored.visits.sub_results?.[0][0].values, [
      { type: "date", value: new Date("2026-09-27T00:00:00Z") },
    ]);
    assert.deepEqual(
      restored.visits.sub_results?.[0][1].sub_results?.[0][0],
      response(
        "coded",
        [
          {
            type: "string",
            coding: { system: "clinical", code: "review", display: "Review" },
          },
        ],
        { note: "Reusable note" },
      ),
    );
    assert.deepEqual(source, snapshot);
  });

  it("fills only empty answers, and explicit replacement never changes unrelated current answers", () => {
    const form = questionnaire([
      question("zero", "integer"),
      question("false", "boolean"),
      question("note", "text"),
      question("blank", "text"),
      question("other", "text"),
    ]);
    const entries = captureFormTemplate(form, {
      zero: response("zero", [{ type: "number", value: 5 }], {
        taken_at: "2020-01-01T00:00:00Z",
        body_site: {
          system: "test",
          code: "source-site",
          display: "Source site",
        },
        method: {
          system: "test",
          code: "source-method",
          display: "Source method",
        },
      }),
      false: response("false", [{ type: "boolean", value: true }]),
      note: response("note", [{ type: "string", value: "Template" }]),
      blank: response("blank", [{ type: "string", value: "Fill this" }]),
    }).entries;
    const current = {
      zero: response("zero", [{ type: "number", value: 0 }], {
        taken_at: "2026-09-27T12:00:00Z",
        body_site: {
          system: "test",
          code: "current-site",
          display: "Current site",
        },
        method: {
          system: "test",
          code: "current-method",
          display: "Current method",
        },
        draft_context: [{ type: "number", value: 100 }],
      }),
      false: response("false", [{ type: "boolean", value: false }]),
      note: response("note", [], { note: "Existing clinician note" }),
      blank: response("blank", [], { taken_at: "2026-09-27T13:00:00Z" }),
      other: response("other", [{ type: "string", value: "Keep this" }]),
    };
    const snapshot = structuredClone(current);
    const filled = applyFormTemplate(form, current, entries, "empty");
    assert.equal(filled.appliedCount, 1);
    assert.equal(filled.preservedCount, 3);
    assert.deepEqual(filled.responses.zero, current.zero);
    assert.deepEqual(filled.responses.false, current.false);
    assert.deepEqual(filled.responses.note, current.note);
    assert.deepEqual(filled.responses.blank.values, [
      { type: "string", value: "Fill this" },
    ]);
    assert.equal(filled.responses.blank.taken_at, current.blank.taken_at);
    const replaced = applyFormTemplate(form, current, entries, "replace");
    assert.equal(replaced.appliedCount, 4);
    assert.deepEqual(replaced.responses.zero.values, [
      { type: "number", value: 5 },
    ]);
    for (const key of ["taken_at", "body_site", "method"] as const) {
      assert.equal(
        entries.find((entry) => entry.question_id === "zero")?.answer[key],
        undefined,
      );
      assert.deepEqual(replaced.responses.zero[key], current.zero[key]);
    }
    assert.equal(replaced.responses.zero.draft_context, undefined);
    assert.deepEqual(replaced.responses.other, current.other);
    assert.deepEqual(current, snapshot);
  });

  it("accounts for removed fields, changed types and changed options while applying compatible answers", () => {
    const old = questionnaire([
      question("removed", "text", { text: "Old field" }),
      question("type", "integer"),
      question("choice", "choice", { answer_option: [{ value: "old" }] }),
      question("okay", "text"),
    ]);
    const entries = captureFormTemplate(old, {
      removed: response("removed", [{ type: "string", value: "Old answer" }]),
      type: response("type", [{ type: "number", value: 8 }]),
      choice: response("choice", [{ type: "string", value: "old" }]),
      okay: response("okay", [{ type: "string", value: "Still compatible" }]),
    }).entries;
    const updated = questionnaire([
      question("type", "decimal"),
      question("choice", "choice", { answer_option: [{ value: "new" }] }),
      question("okay", "text"),
    ]);
    const result = applyFormTemplate(updated, {}, entries);
    assert.deepEqual(result.unavailable, ["Old field", "type", "choice"]);
    assert.deepEqual(Object.keys(result.responses), ["okay"]);
    assert.deepEqual(result.responses.okay.values, [
      { type: "string", value: "Still compatible" },
    ]);
  });

  it("treats repeated rows as one merge unit and rejects structured records disguised as ordinary answers", () => {
    const form = questionnaire([
      question("rows", "group", {
        repeats: true,
        questions: [question("child", "text")],
      }),
      question("text", "text"),
    ]);
    const entries = captureFormTemplate(form, {
      rows: response("rows", [], {
        sub_results: [
          [response("child", [{ type: "string", value: "Template row 1" }])],
          [response("child", [{ type: "string", value: "Template row 2" }])],
        ],
      }),
    }).entries;
    const current = {
      rows: response("rows", [], {
        sub_results: [
          [response("child", [{ type: "string", value: "Current row" }])],
        ],
      }),
    };
    assert.deepEqual(
      applyFormTemplate(form, current, entries).responses.rows,
      current.rows,
    );
    const replaced = applyFormTemplate(form, current, entries, "replace");
    assert.deepEqual(
      replaced.responses.rows.sub_results?.map((row) => row[0].values[0].value),
      ["Template row 1", "Template row 2"],
    );
    const expandedForm = questionnaire([
      question("rows", "group", {
        repeats: true,
        questions: [question("child", "text"), question("added", "text")],
      }),
    ]);
    const expanded = applyFormTemplate(expandedForm, {}, entries);
    const edited = updateResponsesAtPath(
      expanded.responses,
      [{ questionId: "rows", rowIndex: 0 }],
      {
        added: {
          values: [
            { type: "string", value: "Entered after applying template" },
          ],
        },
      },
    );
    assert.deepEqual(
      edited.rows.sub_results?.[0].find((item) => item.question_id === "added")
        ?.values,
      [{ type: "string", value: "Entered after applying template" }],
    );
    const unsafe: QuestionnaireAnswer = {
      question_id: "text",
      meta: { type: "text", label: "Text" },
      answer: {
        question_id: "text",
        link_id: "text",
        structured_type: null,
        values: [
          {
            type: "string",
            value: { id: "clinical-record", patient: "patient-123" },
          },
        ],
      },
    };
    const rejected = applyFormTemplate(form, current, [unsafe], "replace");
    assert.deepEqual(rejected.unavailable, ["text"]);
    assert.deepEqual(rejected.responses, current);
  });
});
