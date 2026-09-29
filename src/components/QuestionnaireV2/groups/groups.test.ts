import assert from "node:assert/strict";
import { test } from "node:test";

import { initializeResponses } from "@/components/QuestionnaireV2/form/engine/store";
import { extractQuestions } from "@/components/QuestionnaireV2/shared/questionnaireImport";
import type { Question } from "@/types/questionnaire/question";

import {
  groupBindings,
  retainGroupRowErrors,
  updateGroupResponses,
  updateGroupRows,
} from "./bindings";
import {
  getQuestionGroup,
  registerQuestionGroup,
  type RegisteredGroupDefinition,
} from "./registry";
import {
  compatibleGroupFields,
  groupSchemaNeedsRepair,
  groupsNeedingSchemaUpdate,
  instantiateGroupQuestions,
  repairGroupSchema,
} from "./schema";

const definition: RegisteredGroupDefinition = {
  type: "test_group.chart",
  label: "Chart",
  subjects: ["patient"],
  builder: () => null,
  component: () => null,
  schema: [
    {
      link_id: "teeth",
      text: "Teeth",
      type: "choice",
      repeats: true,
      answer_option: [{ value: "16" }],
    },
    {
      link_id: "finding",
      text: "Finding",
      type: "choice",
      repeats: true,
      answer_option: [{ value: "caries" }],
      enable_when: [{ question: "teeth", operator: "equals", answer: "16" }],
    },
    { link_id: "note", text: "Note", type: "text" },
  ],
};
function makeGroup(): Question {
  const group: Question = {
    id: crypto.randomUUID(),
    link_id: "Q_chart",
    text: "Chart",
    type: "group",
    structured_type: definition.type,
  };
  group.questions = instantiateGroupQuestions(group, definition.schema);
  return group;
}

test("registry verifies namespace and schema keys and preserves replacement on stale cleanup", () => {
  assert.throws(() => registerQuestionGroup(definition, "other"));
  assert.throws(() =>
    registerQuestionGroup(
      { ...definition, schema: [...definition.schema, definition.schema[0]] },
      "test_group",
    ),
  );
  const malformed = (patch: Record<string, unknown>) =>
    ({ ...definition, ...patch }) as RegisteredGroupDefinition;
  assert.throws(() =>
    registerQuestionGroup(malformed({ subjects: undefined }), "test_group"),
  );
  assert.throws(() =>
    registerQuestionGroup(malformed({ subjects: ["visit"] }), "test_group"),
  );
  assert.throws(() =>
    registerQuestionGroup(malformed({ component: undefined }), "test_group"),
  );
  assert.throws(() =>
    registerQuestionGroup(malformed({ builder: "Builder" }), "test_group"),
  );
  const first = registerQuestionGroup(definition, "test_group");
  const replacement = { ...definition };
  const second = registerQuestionGroup(replacement, "test_group");
  first();
  assert.equal(getQuestionGroup(definition.type), replacement);
  second();
  assert.equal(getQuestionGroup(definition.type), undefined);
});

test("saved children have unique IDs and scoped references, new fields are nullable", () => {
  const group = makeGroup();
  assert.equal(group.questions![1].enable_when![0].question, "Q_chart__teeth");
  assert.equal(new Set(group.questions!.map((q) => q.id)).size, 3);
  const upgraded = {
    ...definition,
    schema: [
      ...definition.schema,
      { link_id: "new_field", text: "New", type: "text" as const },
    ],
  };
  const cleanup = registerQuestionGroup(upgraded, "test_group");
  try {
    assert.equal(compatibleGroupFields(group, upgraded).new_field, null);
    assert.equal(groupsNeedingSchemaUpdate([group]).length, 0);
    group.questions![1].type = "string";
    assert.equal(compatibleGroupFields(group, upgraded).finding, null);
    assert.deepEqual(
      groupsNeedingSchemaUpdate([group]).map((q) => q.id),
      [group.id],
    );
    assert.equal(groupsNeedingSchemaUpdate([group], () => false).length, 0);
  } finally {
    cleanup();
  }
});

test("backend null structured markers match ordinary children and malformed imports are rejected", () => {
  const group = makeGroup();
  const saved = JSON.parse(JSON.stringify(group)) as Question;
  Object.assign(saved.questions![0], { structured_type: null });
  assert.equal(
    compatibleGroupFields(saved, definition).teeth?.id,
    saved.questions![0].id,
  );
  assert.equal(
    extractQuestions({ questions: [{ ...group, structured_type: {} }] }),
    null,
  );
  assert.ok(extractQuestions({ questions: [saved] }));
});

test("editor schema comparison detects missing, extra, reordered and changed child definitions", () => {
  const group = makeGroup();
  assert.equal(groupSchemaNeedsRepair(group, definition), false);
  const changes: ((changed: Question) => void)[] = [
    (changed) => changed.questions!.pop(),
    (changed) => {
      changed.questions!.push({
        id: crypto.randomUUID(),
        link_id: "Q_chart__extra",
        text: "Extra",
        type: "text",
      });
    },
    (changed) => changed.questions!.reverse(),
    (changed) => {
      changed.questions![0].text = "Updated label";
    },
    (changed) => {
      changed.questions![0].required = true;
    },
    (changed) => {
      changed.questions![0].type = "text";
    },
    (changed) => {
      changed.questions![0].answer_option![0].initial_selected = true;
    },
    (changed) => {
      changed.questions![1].enable_when![0].answer = "17";
    },
    (changed) => {
      changed.repeats = true;
    },
  ];
  for (const change of changes) {
    const changed = structuredClone(group);
    change(changed);
    assert.equal(groupSchemaNeedsRepair(changed, definition), true);
  }

  group.text = "Custom group title";
  group.required = true;
  group.read_only = true;
  group.styling_metadata = { classes: "custom-group" };
  group.questions![0].id = crypto.randomUUID();
  assert.equal(groupSchemaNeedsRepair(group, definition), false);
});

test("repair updates authoritative fields and nesting while retaining matching IDs", (context) => {
  const group = makeGroup();
  const [teeth, finding, note] = group.questions!;
  const [section] = instantiateGroupQuestions(group, [
    { link_id: "section", text: "Section", type: "group" },
  ]);
  section.questions = [note];
  group.questions = [teeth, finding, section];
  Object.assign(teeth, {
    required: true,
    answer_value_set: { slug: "old-options" },
    unit: { system: "unit", code: "kg", display: "kg" },
  });
  Object.assign(group, {
    text: "Custom chart",
    required: true,
    description: "Custom description",
    read_only: true,
    styling_metadata: { classes: "custom-group" },
  });
  const updated: RegisteredGroupDefinition = {
    ...definition,
    repeats: true,
    schema: [
      { link_id: "note", text: "Notes", type: "text" },
      {
        link_id: "section",
        text: "Updated section",
        type: "group",
        questions: [
          { link_id: "teeth", text: "Count", type: "integer" },
          {
            link_id: "added",
            text: "Added",
            type: "text",
            enable_when: [
              { question: "teeth", operator: "greater", answer: 0 },
              { question: "outside", operator: "equals", answer: false },
            ],
          },
        ],
      },
    ],
  };
  const originalGroup = structuredClone(group);
  const originalSchema = structuredClone(updated.schema);
  const uuid = context.mock.method(crypto, "randomUUID");
  assert.equal(groupSchemaNeedsRepair(group, updated), true);
  assert.equal(uuid.mock.callCount(), 0);
  const patch = repairGroupSchema(group, updated);
  assert.deepEqual(Object.keys(patch).sort(), ["questions", "repeats"]);
  const repaired = { ...group, ...patch };
  const [repairedNote, repairedSection] = repaired.questions!;
  const [repairedTeeth, added] = repairedSection.questions!;
  assert.equal(uuid.mock.callCount(), 1);
  assert.equal(repairedNote.id, note.id);
  assert.equal(repairedSection.id, section.id);
  assert.equal(repairedTeeth.id, teeth.id);
  assert.equal(repairedTeeth.type, "integer");
  for (const property of [
    "required",
    "repeats",
    "answer_option",
    "answer_value_set",
    "unit",
  ]) {
    assert.equal(Object.hasOwn(repairedTeeth, property), false, property);
  }
  assert.deepEqual(
    added.enable_when!.map((condition) => condition.question),
    ["Q_chart__teeth", "outside"],
  );
  assert.equal(added.enable_when![1].answer, false);
  assert.equal(repaired.repeats, true);
  assert.equal(repaired.text, "Custom chart");
  assert.equal(repaired.required, true);
  assert.deepEqual(group, originalGroup);
  assert.deepEqual(updated.schema, originalSchema);
  assert.equal(groupSchemaNeedsRepair(repaired, updated), false);
  assert.deepEqual(repairGroupSchema(repaired, updated), patch);
  assert.equal(uuid.mock.callCount(), 1);
});

test("backend nulls, false flags and empty defaults do not require schema repair", () => {
  const group = makeGroup();
  for (const child of group.questions!) {
    Object.assign(child, {
      code: null,
      description: null,
      structured_type: null,
      collect_time: false,
      collect_performer: false,
      collect_body_site: null,
      collect_method: null,
      required: false,
      read_only: false,
      max_length: null,
      answer_constraint: null,
      answer_value_set: null,
      is_observation: null,
      unit: null,
      questions: [],
      formula: null,
      styling_metadata: {},
      templates: [],
      is_component: false,
      meta: {},
    });
    child.answer_option?.forEach((option) =>
      Object.assign(option, { initial_selected: false, meta: {} }),
    );
    child.enable_when?.forEach((condition) =>
      Object.assign(condition, { meta: {} }),
    );
  }
  Object.assign(group.questions![2], {
    repeats: null,
    answer_option: null,
    enable_when: null,
    enable_behavior: null,
    disabled_display: null,
  });
  Object.assign(group, { repeats: null });
  assert.equal(groupSchemaNeedsRepair(group, definition), false);
  const repaired = { ...group, ...repairGroupSchema(group, definition) };
  assert.equal(groupSchemaNeedsRepair(repaired, definition), false);
});

test("schema comparison matches the backend answer-option wire shape", () => {
  const displayedOptions: RegisteredGroupDefinition = {
    ...definition,
    schema: [
      {
        link_id: "tooth",
        text: "Tooth",
        type: "choice",
        answer_option: [
          {
            value: "16",
            display: "Upper right first molar",
            code: { system: "teeth", code: "16", display: "16" },
          },
          { value: "17", display: "Upper right second molar" },
        ],
      },
    ],
  };
  const group = makeGroup();
  Object.assign(group, repairGroupSchema(group, displayedOptions));
  group.questions![0].answer_option = [
    { value: "16", initial_selected: false },
    { value: "17", initial_selected: false },
  ];
  assert.equal(groupSchemaNeedsRepair(group, displayedOptions), false);
  group.questions![0].answer_option.reverse();
  assert.equal(groupSchemaNeedsRepair(group, displayedOptions), true);
});

test("schema comparison preserves false condition answers and template data", () => {
  const withDefaults: RegisteredGroupDefinition = {
    ...definition,
    schema: [
      { link_id: "enabled", text: "Enabled", type: "boolean" },
      {
        link_id: "note",
        text: "Note",
        type: "text",
        required: false,
        enable_when: [
          { question: "enabled", operator: "equals", answer: false },
        ],
        templates: [
          { name: "Default", content: "Content", structured_content: {} },
        ],
      },
    ],
  };
  const group = makeGroup();
  Object.assign(group, repairGroupSchema(group, withDefaults));
  Object.assign(group.questions![1].templates![0], {
    structured_content: null,
    meta: null,
  });
  assert.equal(groupSchemaNeedsRepair(group, withDefaults), false);
  group.questions![1].enable_when![0].answer = true;
  assert.equal(groupSchemaNeedsRepair(group, withDefaults), true);
  group.questions![1].enable_when![0].answer = false;
  Object.assign(withDefaults.schema[1].templates![0], {
    structured_content: { required: false },
  });
  Object.assign(group.questions![1].templates![0], {
    structured_content: { required: false },
  });
  assert.equal(groupSchemaNeedsRepair(group, withDefaults), false);
  Object.assign(group.questions![1].templates![0], {
    structured_content: { required: true },
  });
  assert.equal(groupSchemaNeedsRepair(group, withDefaults), true);
});

test("chart batch enables a field and records ordinary answers atomically, and clears disabled findings", () => {
  const group = makeGroup();
  const [teeth, finding] = group.questions!;
  const initial = initializeResponses([group]);
  assert.equal(initial[group.id], undefined);
  assert.equal(
    groupBindings(group, definition, [group], initial, [], false).finding
      ?.hidden,
    true,
  );
  const selected = updateGroupResponses(group, definition, [group], initial, {
    teeth: { values: [{ type: "string", value: "16" }] },
    finding: { values: [{ type: "string", value: "caries" }] },
  });
  assert.deepEqual(selected[finding.id].values, [
    { type: "string", value: "caries" },
  ]);
  assert.equal(selected[finding.id].structured_type, null);
  const cleared = updateGroupResponses(group, definition, [group], selected, {
    teeth: { values: [] },
    finding: { values: [] },
  });
  assert.deepEqual(cleared[teeth.id].values, []);
  assert.deepEqual(cleared[finding.id].values, []);
  const rejected = updateGroupResponses(group, definition, [group], initial, {
    finding: { values: [{ type: "string", value: "caries" }] },
  });
  assert.equal(rejected[finding.id], initial[finding.id]);
});

test("registered field bindings enforce ancestor read-only, conditions and immutable response identity", () => {
  const group = makeGroup();
  const note = group.questions![2];
  const initial = initializeResponses([group]);
  const changed = updateGroupResponses(group, definition, [group], initial, {
    note: {
      question_id: "spoof",
      structured_type: "diagnosis",
      values: [{ type: "string", value: "Hello" }],
    },
  });
  assert.equal(changed[note.id].question_id, note.id);
  assert.equal(changed[note.id].structured_type, null);
  group.read_only = true;
  const locked = updateGroupResponses(group, definition, [group], initial, {
    note: { values: [{ type: "string", value: "Ignored" }] },
  });
  assert.equal(locked[note.id], initial[note.id]);
  assert.equal(
    groupBindings(group, definition, [group], initial, [], false).note
      ?.disabled,
    true,
  );
});

test("rejected hidden controller cannot enable a dependent write in the same batch", () => {
  const group = makeGroup();
  const [teeth, finding, note] = group.questions!;
  teeth.enable_when = [
    { question: note.link_id, operator: "equals", answer: "enabled" },
  ];
  const initial = initializeResponses([group]);
  const result = updateGroupResponses(group, definition, [group], initial, {
    teeth: { values: [{ type: "string", value: "16" }] },
    finding: { values: [{ type: "string", value: "caries" }] },
  });
  assert.equal(result[teeth.id], initial[teeth.id]);
  assert.equal(result[finding.id], initial[finding.id]);
});

test("repeated group rows keep paired child answers and remove by row identity", () => {
  const repeated = { ...definition, repeats: true };
  const group = { ...makeGroup(), repeats: true };
  const [tooth, finding] = group.questions!;
  let responses = initializeResponses([group]);
  assert.equal(responses[tooth.id], undefined);
  for (const value of ["caries", "crown"]) {
    responses = updateGroupRows(group, repeated, [group], responses, {
      type: "add",
      updates: {
        teeth: { values: [{ type: "string", value: "16" }] },
        finding: { values: [{ type: "string", value }] },
      },
    });
  }
  const rows = responses[group.id].sub_results!;
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map(
      (row) =>
        row.find((answer) => answer.question_id === finding.id)!.values[0]
          .value,
    ),
    ["caries", "crown"],
  );
  responses = updateGroupRows(group, repeated, [group], responses, {
    type: "remove",
    row: rows[0],
  });
  responses = updateGroupRows(group, repeated, [group], responses, {
    type: "remove",
    row: rows[1],
  });
  assert.deepEqual(responses[group.id].sub_results, []);
  assert.equal(
    compatibleGroupFields({ ...group, repeats: false }, repeated).teeth,
    null,
  );
});

test("row update clears only the edited row's changed errors; add/remove clear every row", () => {
  const repeated = { ...definition, repeats: true };
  const group = { ...makeGroup(), repeats: true };
  const [noteId, teethId] = [group.questions![2].id, group.questions![0].id];
  const questions = [group];
  let responses = initializeResponses(questions);
  for (const action of [
    { type: "add" as const, updates: {} },
    { type: "add" as const, updates: {} },
  ]) {
    responses = updateGroupRows(group, repeated, questions, responses, action);
  }
  const rows = responses[group.id].sub_results!;
  const rowPath = (rowIndex: number) => [{ questionId: group.id, rowIndex }];
  const errors = [
    { question_id: group.id, msg: "Group" },
    { question_id: noteId, response_path: rowPath(0), msg: "First note" },
    { question_id: teethId, response_path: rowPath(0), msg: "First teeth" },
    { question_id: noteId, response_path: rowPath(1), msg: "Second note" },
    { question_id: noteId, msg: "Server note" },
    { question_id: "other", msg: "Other" },
  ];
  const update = {
    type: "update" as const,
    row: rows[0],
    updates: {
      note: { values: [{ type: "string" as const, value: "changed" }] },
    },
  };
  const updated = updateGroupRows(
    group,
    repeated,
    questions,
    responses,
    update,
  );
  const retain = (
    action: Parameters<typeof retainGroupRowErrors>[3],
    next = updated,
  ) =>
    retainGroupRowErrors(
      errors,
      [],
      group.id,
      action,
      rows,
      next[group.id].sub_results!,
    ).map((error) => error.msg);
  assert.deepEqual(retain(update), [
    "Group",
    "First teeth",
    "Second note",
    "Other",
  ]);
  const untouched = {
    type: "update" as const,
    row: rows[0],
    updates: { unknown: {} },
  };
  assert.deepEqual(
    retain(
      untouched,
      updateGroupRows(group, repeated, questions, responses, untouched),
    ),
    errors.map((error) => error.msg),
  );
  const removed = { type: "remove" as const, row: rows[1] };
  assert.deepEqual(
    retain(
      removed,
      updateGroupRows(group, repeated, questions, responses, removed),
    ),
    ["Server note", "Other"],
  );
});
