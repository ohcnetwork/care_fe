import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { mergeDraftResponses } from "./draftMerge";

/** Minimal, deliberately-permissive Question builder — every field a test
 *  doesn't care about is left undefined. */
function q(over: Partial<Question> & Pick<Question, "id" | "type">): Question {
  return {
    link_id: over.id,
    text: over.id,
    ...over,
  };
}

/** Minimal response builder. */
function response(
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

describe("mergeDraftResponses — compatibility-aware draft merge", () => {
  it("restores a plain answer unchanged when the question still exists with the same (shape-compatible) type", () => {
    const questions = [q({ id: "q1", type: "string" })];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [{ type: "string", value: "hello" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, [{ type: "string", value: "hello" }]);
    assert.deepEqual(dropped, []);
  });

  it("CARRY-OVER RULE: question removed from the tree — dropped, reason question_removed, labeled by link_id (no live Question left to name it)", () => {
    const questions: Question[] = []; // q1 no longer exists
    const draft = {
      q1: response({
        question_id: "q1",
        link_id: "removed-question-link",
        values: [{ type: "string", value: "orphaned answer" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.equal(responses.q1, undefined);
    assert.deepEqual(dropped, [
      {
        questionId: "q1",
        label: "removed-question-link",
        reason: "question_removed",
      },
    ]);
  });

  it("an EMPTY response for a removed question is not reported as dropped — nothing was lost", () => {
    const questions: Question[] = [];
    const draft = { q1: response({ question_id: "q1", values: [] }) };

    const { dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(dropped, []);
  });

  it("CARRY-OVER RULE: question type changed to something shape-incompatible — dropped, reason type_changed, labeled by the CURRENT question's text", () => {
    const questions = [q({ id: "q1", type: "integer", text: "Age" })];
    const draft = {
      // Was a "string"-shaped answer (e.g. a free-text question), now the
      // author changed it to "integer" — RV type "string" never fits
      // "integer"'s expected "number".
      q1: response({
        question_id: "q1",
        values: [{ type: "string", value: "not a number" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    // Falls back to the fresh (empty) seed for q1, not the stale value.
    assert.deepEqual(responses.q1.values, []);
    assert.deepEqual(dropped, [
      { questionId: "q1", label: "Age", reason: "type_changed" },
    ]);
  });

  it("boolean -> string is also a type change (shape mismatch), even though both are simple scalars", () => {
    const questions = [q({ id: "q1", type: "boolean", text: "Consented?" })];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [{ type: "string", value: "yes" }],
      }),
    };

    const { dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(dropped, [
      { questionId: "q1", label: "Consented?", reason: "type_changed" },
    ]);
  });

  it("string <-> choice <-> text <-> url are shape-compatible with each other (all RV type 'string') — restores across that change", () => {
    const questions = [q({ id: "q1", type: "text", text: "Notes" })];
    const draft = {
      // Originally answered as a plain "string" question, now retyped to "text".
      q1: response({
        question_id: "q1",
        values: [{ type: "string", value: "kept" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, [{ type: "string", value: "kept" }]);
    assert.deepEqual(dropped, []);
  });

  it("CARRY-OVER RULE: a choice answer option that no longer exists is filtered out — reason option_removed — while a still-valid selection alongside it survives", () => {
    const questions = [
      q({
        id: "q1",
        type: "choice",
        text: "Severity",
        repeats: true,
        answer_option: [
          { value: "mild" },
          { value: "severe" },
          // "moderate" removed by the questionnaire author.
        ],
      }),
    ];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [
          { type: "string", value: "mild" },
          { type: "string", value: "moderate" }, // no longer a valid option
        ],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, [{ type: "string", value: "mild" }]);
    assert.deepEqual(dropped, [
      { questionId: "q1", label: "Severity", reason: "option_removed" },
    ]);
  });

  it("a choice answer whose ONLY selected option was removed drops entirely (empty values), still reported once", () => {
    const questions = [
      q({
        id: "q1",
        type: "choice",
        text: "Severity",
        answer_option: [{ value: "mild" }],
      }),
    ];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [{ type: "string", value: "critical" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, []);
    assert.deepEqual(dropped, [
      { questionId: "q1", label: "Severity", reason: "option_removed" },
    ]);
  });

  it("a choice question with NO answer_option (valueset-backed) is NOT verified — restores as-is, undocumented as anything but trusted", () => {
    const questions = [
      q({
        id: "q1",
        type: "choice",
        text: "Diagnosis code",
        answer_value_set: { slug: "icd-10" },
      }),
    ];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [
          {
            type: "string",
            value: "J45",
            coding: { system: "s", code: "J45", display: "Asthma" },
          },
        ],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, draft.q1.values);
    assert.deepEqual(dropped, []);
  });

  it("CARRY-OVER RULE: a quantity's fixed unit changed — the stored coding no longer matches — dropped as option_removed", () => {
    const questions = [
      q({
        id: "q1",
        type: "quantity",
        text: "Weight",
        unit: { system: "ucum", code: "kg", display: "kilogram" },
      }),
    ];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [
          {
            type: "quantity",
            value: 70,
            unit: { system: "ucum", code: "lb", display: "pound" },
            coding: { system: "ucum", code: "lb", display: "pound" },
          },
        ],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, []);
    assert.deepEqual(dropped, [
      { questionId: "q1", label: "Weight", reason: "option_removed" },
    ]);
  });

  it("a quantity whose unit still matches the fixed unit restores unchanged", () => {
    const questions = [
      q({
        id: "q1",
        type: "quantity",
        text: "Weight",
        unit: { system: "ucum", code: "kg", display: "kilogram" },
      }),
    ];
    const entry = {
      type: "quantity" as const,
      value: 70,
      unit: { system: "ucum", code: "kg", display: "kilogram" },
      coding: { system: "ucum", code: "kg", display: "kilogram" },
    };
    const draft = { q1: response({ question_id: "q1", values: [entry] }) };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, [entry]);
    assert.deepEqual(dropped, []);
  });

  it("a quantity backed by a dynamic answer_value_set is NOT verified (documented scope limit) — restores as-is", () => {
    const questions = [
      q({
        id: "q1",
        type: "quantity",
        text: "Dose",
        answer_value_set: { slug: "ucum" },
      }),
    ];
    const entry = {
      type: "quantity" as const,
      value: 5,
      unit: { system: "ucum", code: "mg", display: "milligram" },
      coding: { system: "ucum", code: "mg", display: "milligram" },
    };
    const draft = { q1: response({ question_id: "q1", values: [entry] }) };

    const { responses } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.values, [entry]);
  });

  it("CARRY-OVER RULE: structured edits overlay by rowId when structured_type still matches — the edit log restores verbatim", () => {
    const questions = [
      q({
        id: "q1",
        type: "structured",
        structured_type: "diagnosis",
        text: "Diagnoses",
      }),
    ];
    const edits = [{ rowId: "r1", op: "add" as const, patch: { code: "J45" } }];
    const draft = {
      q1: response({
        question_id: "q1",
        structured_type: "diagnosis",
        values: [],
        edits,
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.edits, edits);
    assert.deepEqual(dropped, []);
  });

  it("CARRY-OVER RULE: structured_type changed — dropped entirely (whole-response gate), reason type_changed", () => {
    const questions = [
      q({
        id: "q1",
        type: "structured",
        structured_type: "symptom",
        text: "Symptoms",
      }),
    ];
    const draft = {
      q1: response({
        question_id: "q1",
        structured_type: "diagnosis", // was diagnosis, question retyped to symptom
        values: [],
        edits: [{ rowId: "r1", op: "add" as const, patch: { code: "J45" } }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.q1.edits, undefined);
    assert.deepEqual(dropped, [
      { questionId: "q1", label: "Symptoms", reason: "type_changed" },
    ]);
  });

  it("a structured question with an empty edit log and structured_type mismatch is not reported (nothing to lose)", () => {
    const questions = [
      q({
        id: "q1",
        type: "structured",
        structured_type: "symptom",
        text: "Symptoms",
      }),
    ];
    const draft = {
      q1: response({
        question_id: "q1",
        structured_type: "diagnosis",
        values: [],
        edits: [],
      }),
    };

    const { dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(dropped, []);
  });

  it("a question the draft never mentions still seeds its normal fresh/initial response", () => {
    const questions = [
      q({
        id: "q1",
        type: "choice",
        answer_option: [{ value: "a", initial_selected: true }],
      }),
    ];
    const { responses } = mergeDraftResponses(questions, {});

    assert.deepEqual(responses.q1.values, [
      { type: "string", value: "a", coding: undefined },
    ]);
  });

  it("MULTIPLE DROPS in one merge, each with its own reason and label — the restore bar's real-world shape", () => {
    const questions = [
      q({ id: "kept", type: "string", text: "Kept" }),
      q({ id: "retyped", type: "integer", text: "Retyped" }),
      q({
        id: "narrowed",
        type: "choice",
        text: "Narrowed",
        answer_option: [{ value: "still-here" }],
      }),
    ];
    const draft = {
      kept: response({
        question_id: "kept",
        values: [{ type: "string", value: "x" }],
      }),
      removed: response({
        question_id: "removed",
        link_id: "removed-link",
        values: [{ type: "string", value: "gone" }],
      }),
      retyped: response({
        question_id: "retyped",
        values: [{ type: "string", value: "was text" }],
      }),
      narrowed: response({
        question_id: "narrowed",
        values: [{ type: "string", value: "gone-option" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.kept.values, [{ type: "string", value: "x" }]);
    assert.equal(dropped.length, 3);
    assert.deepEqual(
      new Set(dropped.map((d) => d.reason)),
      new Set(["question_removed", "type_changed", "option_removed"]),
    );
  });

  it("questions nested in groups are indexed and merged the same as top-level ones", () => {
    const questions = [
      q({
        id: "grp",
        type: "group",
        questions: [q({ id: "nested", type: "string", text: "Nested" })],
      }),
    ];
    const draft = {
      nested: response({
        question_id: "nested",
        values: [{ type: "string", value: "in a group" }],
      }),
    };

    const { responses, dropped } = mergeDraftResponses(questions, draft);

    assert.deepEqual(responses.nested.values, [
      { type: "string", value: "in a group" },
    ]);
    assert.deepEqual(dropped, []);
  });

  it("purity — never mutates the input questions or draft", () => {
    const questions = [q({ id: "q1", type: "string", text: "Q1" })];
    const draft = {
      q1: response({
        question_id: "q1",
        values: [{ type: "string", value: "hi" }],
      }),
    };
    const questionsSnapshot = structuredClone(questions);
    const draftSnapshot = structuredClone(draft);

    mergeDraftResponses(questions, draft);

    assert.deepEqual(questions, questionsSnapshot);
    assert.deepEqual(draft, draftSnapshot);
  });
});
