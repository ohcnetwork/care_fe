import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import type { Question } from "@/types/questionnaire/question";

import { parseServerDraft } from "./serverDraft";

type Dump = Pick<FormSubmissionRead, "status" | "response_dump">;

function dump(
  responses: unknown[],
  over: {
    status?: FormSubmissionRead["status"];
    questionnaireId?: string;
  } = {},
): Dump {
  return {
    status: over.status ?? "draft",
    response_dump: {
      questionnaireResponses: {
        questionnaire: { id: over.questionnaireId ?? "qn-1" },
        responses,
      },
    },
  } as Dump;
}

function answer(
  over: Partial<QuestionnaireResponse> &
    Pick<QuestionnaireResponse, "question_id">,
): QuestionnaireResponse {
  return {
    structured_type: null,
    link_id: over.question_id,
    values: [],
    ...over,
  };
}

const QUESTIONNAIRE = {
  id: "qn-1",
  questions: [
    { id: "q1", link_id: "q1", text: "Systolic", type: "string" },
  ] as Question[],
};

describe("parseServerDraft — resuming ?continue_draft=", () => {
  it("restores an answer the current questionnaire still accepts", () => {
    const state = parseServerDraft(
      dump([
        answer({
          question_id: "q1",
          values: [{ type: "string", value: "120" }],
        }),
      ]),
      QUESTIONNAIRE,
    );

    assert.equal(state.mismatch, false);
    if (state.mismatch) return;
    assert.deepEqual(state.responses.q1.values, [
      { type: "string", value: "120" },
    ]);
    assert.deepEqual(state.dropped, []);
  });

  it("NAMES an answer whose question the questionnaire no longer has, instead of dropping it silently at the provider seed", () => {
    const state = parseServerDraft(
      dump([
        answer({
          question_id: "gone",
          link_id: "gone-link",
          values: [{ type: "string", value: "recorded" }],
        }),
      ]),
      QUESTIONNAIRE,
    );

    assert.equal(state.mismatch, false);
    if (state.mismatch) return;
    assert.deepEqual(state.dropped, [
      { questionId: "gone", label: "gone-link", reason: "question_removed" },
    ]);
    assert.equal(state.responses.gone, undefined);
  });

  it("drops a stored answer whose question was RETYPED — a stale shape must never reach the submit batch", () => {
    const state = parseServerDraft(
      dump([
        answer({
          question_id: "q1",
          values: [{ type: "boolean", value: true }],
        }),
      ]),
      QUESTIONNAIRE,
    );

    assert.equal(state.mismatch, false);
    if (state.mismatch) return;
    assert.deepEqual(state.dropped, [
      { questionId: "q1", label: "Systolic", reason: "type_changed" },
    ]);
    assert.deepEqual(state.responses.q1.values, []);
  });

  it("revives dates the dump flattened to strings", () => {
    const state = parseServerDraft(
      dump([
        answer({
          question_id: "q1",
          values: [
            {
              type: "date",
              value: "2026-01-02T00:00:00.000Z" as unknown as Date,
            },
          ],
        }),
      ]),
      {
        id: "qn-1",
        questions: [
          { id: "q1", link_id: "q1", text: "Taken on", type: "date" },
        ],
      },
    );

    assert.equal(state.mismatch, false);
    if (state.mismatch) return;
    assert.equal(state.responses.q1.values[0].value instanceof Date, true);
  });

  it("never mutates the record it was handed — the dump belongs to the query cache a re-save PUTs back", () => {
    const stored = answer({
      question_id: "q1",
      values: [
        { type: "date", value: "2026-01-02T00:00:00.000Z" as unknown as Date },
      ],
    });
    const record = dump([stored]);

    const state = parseServerDraft(record, {
      id: "qn-1",
      questions: [{ id: "q1", link_id: "q1", text: "Taken on", type: "date" }],
    });

    assert.equal(state.mismatch, false);
    if (state.mismatch) return;
    // Revival rewrites `value` in place, and a Date serializes to the same
    // ISO string it was parsed from — so the cached entry is only provably
    // untouched through its runtime TYPE and object IDENTITY, never through
    // a JSON projection of the record.
    assert.equal(typeof stored.values[0].value, "string");
    assert.equal(stored.values[0].value, "2026-01-02T00:00:00.000Z");
    assert.notEqual(state.responses.q1.values, stored.values);
    assert.notEqual(state.responses.q1.values[0], stored.values[0]);
    assert.equal(state.responses.q1.values[0].value instanceof Date, true);
  });

  it("a submitted (or entered-in-error) record does not resume — one submission must not file twice", () => {
    assert.deepEqual(
      parseServerDraft(dump([], { status: "submitted" }), QUESTIONNAIRE),
      { mismatch: true },
    );
  });

  it("a dump for a DIFFERENT questionnaire does not resume", () => {
    assert.deepEqual(
      parseServerDraft(
        dump([], { questionnaireId: "qn-other" }),
        QUESTIONNAIRE,
      ),
      { mismatch: true },
    );
  });

  it("a malformed dump lands on the not-recoverable branch rather than crashing the renderer", () => {
    assert.deepEqual(
      parseServerDraft(
        { status: "draft", response_dump: null } as unknown as Dump,
        QUESTIONNAIRE,
      ),
      { mismatch: true },
    );
    assert.deepEqual(
      parseServerDraft(dump([{ no_question_id: true }]), QUESTIONNAIRE),
      { mismatch: true },
    );
  });
});
