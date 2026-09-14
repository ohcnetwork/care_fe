import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  ActionInstructionDefinition,
  QuestionnaireAction,
} from "@/types/questionnaire/actions";
import type { Question } from "@/types/questionnaire/question";

import { findActionIssues } from "./actionValidation";

const questions: Question[] = [
  { id: "1", link_id: "fever", text: "Fever", type: "boolean" },
  {
    id: "2",
    link_id: "vitals",
    text: "Vitals",
    type: "group",
    questions: [{ id: "3", link_id: "temp", text: "Temp", type: "decimal" }],
  },
  {
    id: "4",
    link_id: "followup",
    text: "Follow up",
    type: "string",
    enable_when: [{ question: "fever", operator: "equals", answer: "Yes" }],
  },
  {
    id: "5",
    link_id: "hidden_group",
    text: "Hidden group",
    type: "group",
    enable_when: [{ question: "fever", operator: "equals", answer: "Yes" }],
    questions: [{ id: "6", link_id: "inner", text: "Inner", type: "string" }],
  },
];

const logging: ActionInstructionDefinition = {
  slug: "logging",
  input_schema: {
    properties: { message: { type: "string" } },
    required: ["message"],
  },
  output_schema: {},
  context: "Appointment",
  instruction_type: "NOTIFY",
};

const valid: QuestionnaireAction = {
  condition: "q_fever == True and q_temp > 38",
  instructions: [
    {
      slug: "logging",
      params: { message: '{{ f"temp {q_temp}" }}' },
      context: "self",
    },
  ],
};

const context = { questions, instructions: [logging] };

describe("findActionIssues", () => {
  it("passes a well-formed action", () => {
    assert.deepEqual(findActionIssues([valid], context), []);
  });

  it("reports the first failing rule per action, in action order", () => {
    const withInstruction = (
      params: Record<string, unknown>,
      ctx = "self",
    ) => ({
      ...valid,
      instructions: [{ slug: "logging", params, context: ctx }],
    });
    const issues = findActionIssues(
      [
        { ...valid, condition: "  " },
        { ...valid, condition: "patient.age > 1" },
        { ...valid, condition: 'q_fever == "x' },
        withInstruction({ message: '{{ f"{q_temp" }}' }),
        { ...valid, instructions: [] },
        { ...valid, instructions: [{ slug: "", params: {}, context: "self" }] },
        {
          ...valid,
          instructions: [{ slug: "nope", params: {}, context: "self" }],
        },
        withInstruction({ message: "x" }, ""),
        withInstruction({ message: " " }),
        withInstruction({ message: "{{  }}" }),
        { ...valid, condition: "q_gone == True" },
        withInstruction({ message: "{{ q_gone }}" }),
        { ...valid, condition: 'q_followup == "x"' },
        withInstruction({ message: "{{ q_inner }}" }),
      ],
      context,
    );
    assert.deepEqual(issues, [
      { index: 0, messageKey: "action_issue_condition_empty" },
      { index: 1, messageKey: "action_issue_expression_attribute" },
      { index: 2, messageKey: "action_issue_expression_syntax" },
      { index: 3, messageKey: "action_issue_expression_syntax" },
      { index: 4, messageKey: "action_issue_no_instructions" },
      { index: 5, messageKey: "action_issue_instruction_missing" },
      { index: 6, messageKey: "action_issue_instruction_unknown" },
      { index: 7, messageKey: "action_issue_context_missing" },
      { index: 8, messageKey: "action_issue_param_required" },
      { index: 9, messageKey: "action_issue_param_required" },
      { index: 10, messageKey: "action_issue_unknown_question" },
      { index: 11, messageKey: "action_issue_unknown_question" },
      { index: 12, messageKey: "action_issue_conditional_question" },
      { index: 13, messageKey: "action_issue_conditional_question" },
    ]);
  });

  it("stands down the registry rules until the registry has loaded", () => {
    const issues = findActionIssues(
      [
        {
          ...valid,
          instructions: [{ slug: "nope", params: {}, context: "self" }],
        },
      ],
      { questions },
    );
    assert.deepEqual(issues, []);
  });
});
