import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ActionContextField } from "@/types/questionnaire/actions";
import type { Question } from "@/types/questionnaire/question";

import {
  dedupeContextFields,
  operatorsFor,
  questionOfRef,
  questionVariables,
  reachableContextPaths,
  reachableContextValues,
} from "./actionVariables";

/** The registry as the ENG-737 backend serves it — with its duplicates. */
const fields: ActionContextField[] = [
  { context_type: "Patient", field: "age", evaluation: "static" },
  {
    context_type: "Appointment",
    field: "patient",
    evaluation: "static",
    target_context_type: "Patient",
  },
  {
    context_type: "EncounterQuestionnaire",
    field: "patient",
    evaluation: "static",
    target_context_type: "Patient",
  },
  { context_type: "Patient", field: "age", evaluation: "static" },
  {
    context_type: "EncounterQuestionnaire",
    field: "patient",
    evaluation: "static",
    target_context_type: "Patient",
  },
];

describe("context graph", () => {
  it("dedupes the registry's repeated entries", () => {
    assert.equal(dedupeContextFields(fields).length, 3);
  });

  it("walks typed edges from the root and lists leaf values", () => {
    const deduped = dedupeContextFields(fields);
    assert.deepEqual(reachableContextPaths("EncounterQuestionnaire", deduped), [
      { path: "self", contextType: "EncounterQuestionnaire" },
      { path: "patient", contextType: "Patient" },
    ]);
    assert.deepEqual(
      reachableContextValues("EncounterQuestionnaire", deduped),
      [
        {
          ref: "patient.age",
          segments: ["patient", "age"],
          ownerContextType: "Patient",
        },
      ],
    );
  });

  it("offers only self for a root with no registered fields", () => {
    assert.deepEqual(reachableContextPaths("PatientQuestionnaire", fields), [
      { path: "self", contextType: "PatientQuestionnaire" },
    ]);
    assert.deepEqual(
      reachableContextValues("PatientQuestionnaire", fields),
      [],
    );
  });

  it("does not loop on a cyclic registry and skips dynamic fields", () => {
    const cyclic: ActionContextField[] = [
      {
        context_type: "A",
        field: "b",
        evaluation: "static",
        target_context_type: "B",
      },
      {
        context_type: "B",
        field: "a",
        evaluation: "static",
        target_context_type: "A",
      },
      { context_type: "B", field: "anything", evaluation: "dynamic" },
      { context_type: "B", field: "name", evaluation: "static" },
    ];
    assert.deepEqual(reachableContextPaths("A", cyclic), [
      { path: "self", contextType: "A" },
      { path: "b", contextType: "B" },
    ]);
    assert.deepEqual(
      reachableContextValues("A", cyclic).map((value) => value.ref),
      ["b.name"],
    );
  });
});

describe("questionVariables", () => {
  const questions: Question[] = [
    { id: "1", link_id: "fever", text: "Fever", type: "boolean" },
    {
      id: "g",
      link_id: "vitals",
      text: "Vitals",
      type: "group",
      questions: [
        { id: "2", link_id: "temp", text: "Temp", type: "decimal" },
        { id: "3", link_id: "weight", text: "Weight", type: "quantity" },
      ],
    },
    {
      id: "4",
      link_id: "severity",
      text: "Severity",
      type: "choice",
      answer_option: [{ value: "mild" }, { value: "severe" }],
    },
    {
      id: "5",
      link_id: "dx",
      text: "Coded",
      type: "choice",
      answer_option: [
        { value: "x", code: { system: "s", code: "c", display: "d" } },
      ],
    },
    {
      id: "6",
      link_id: "symptoms",
      text: "Symptoms",
      type: "choice",
      repeats: true,
      answer_option: [{ value: "cough" }],
    },
    {
      id: "7",
      link_id: "coded_multi",
      text: "Coded multi",
      type: "choice",
      repeats: true,
      answer_option: [
        { value: "x", code: { system: "s", code: "c", display: "d" } },
      ],
    },
    { id: "8", link_id: "Q-abc12345", text: "Default id", type: "string" },
    { id: "9", link_id: "note", text: "Note", type: "display" },
    { id: "10", link_id: "meds", text: "Meds", type: "structured" },
    {
      id: "11",
      link_id: "vs",
      text: "Valueset choice",
      type: "choice",
      answer_value_set: { slug: "system-condition-code" },
    },
    {
      id: "12",
      link_id: "visits",
      text: "Visits",
      type: "group",
      repeats: true,
      questions: [
        { id: "13", link_id: "visit_date", text: "Date", type: "date" },
        {
          id: "14",
          link_id: "visit_notes",
          text: "Notes",
          type: "group",
          questions: [
            { id: "15", link_id: "note_text", text: "Text", type: "string" },
          ],
        },
      ],
    },
    { id: "16", link_id: "seen_at", text: "Seen at", type: "dateTime" },
  ];

  it("derives refs, shapes and unusable reasons in tree order", () => {
    const variables = questionVariables(questions);
    assert.deepEqual(
      variables.map((v) => [v.ref, v.shape, v.unusable ?? null]),
      [
        ["q_fever", "boolean", null],
        ["q_vitals", "text", "type"],
        ["q_temp", "number", null],
        ["q_weight.value", "number", null],
        ["q_severity", "choice", null],
        ["q_dx", "choice", null],
        ["q_symptoms", "choice_multi", null],
        ["q_coded_multi", "choice_multi", null],
        ["q_Q-abc12345", "text", "link_id"],
        ["q_note", "text", "type"],
        ["q_meds", "text", "type"],
        ["q_vs.coding.code", "choice", null],
        ["q_visits", "text", "type"],
        ["q_visit_date", "text", "repeating_group"],
        ["q_visit_notes", "text", "repeating_group"],
        ["q_note_text", "text", "repeating_group"],
        ["q_seen_at", "text", "type"],
      ],
    );
  });

  it("resolves a rule ref back to its question", () => {
    const variables = questionVariables(questions);
    assert.equal(questionOfRef("q_weight.value", variables)?.question.id, "3");
    assert.equal(questionOfRef("q_fever", variables)?.question.id, "1");
    assert.equal(questionOfRef("patient.age", variables), undefined);
    assert.equal(questionOfRef("q_missing", variables), undefined);
  });

  it("offers operators by answer shape, every comparison for context values", () => {
    assert.deepEqual(operatorsFor("boolean"), ["==", "!="]);
    assert.deepEqual(operatorsFor("choice_multi"), ["in", "not in"]);
    assert.deepEqual(operatorsFor("number"), [
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
    ]);
    assert.deepEqual(operatorsFor(undefined), [
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
    ]);
  });
});
